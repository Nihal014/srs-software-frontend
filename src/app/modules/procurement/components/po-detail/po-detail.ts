import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PoService } from '../../po.service';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import { ItemsService } from 'app/shared/services/items.service';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import { AuthService } from 'app/core/services/auth.service';
import { PrintService } from 'app/print/services/print.service';
import type { PoPrintData } from '../../print/po-print/po-print';
import { DateField } from 'app/shared/components/date-field/date-field';
import { parseDateString, toDateString } from 'app/shared/utils/date.util';
import { createPoLineGroup, poLineTotal, poTotals, type PoLineGroup } from 'app/shared/forms/po-line.form';
import type { Supplier } from 'app/shared/models/supplier.model';
import type { Item } from 'app/shared/models/item.model';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import {
  PO_STATUS,
  PO_STATUS_LABEL,
  PO_STATUS_SLUG,
  type PoStatus,
  type PurchaseOrderDetail,
} from 'app/shared/models/purchase-order.model';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];
import { ConfirmService } from 'app/shared/services/confirm.service';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DateField,
    DecimalPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './po-detail.html',
  styleUrl: './po-detail.scss',
})
export class PoDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private poService = inject(PoService);
  private suppliersService = inject(SuppliersService);
  private itemsService = inject(ItemsService);
  private deliveryLocationsService = inject(DeliveryLocationsService);
  private snackBar = inject(MatSnackBar);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);
  private printService = inject(PrintService);
  readonly auth = inject(AuthService);

  readonly deliveryLocations = signal<DeliveryLocation[]>([]);
  readonly paymentTerms = PAYMENT_TERMS;
  readonly PO_STATUS = PO_STATUS;
  readonly lineColumns = ['slno', 'item', 'unit', 'qty', 'rate', 'tax', 'discount', 'total', 'remove'];
  readonly grnColumns = ['slno', 'grn_number', 'received_date', 'qty_received', 'qty_accepted', 'qty_rejected', 'batch_numbers'];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly suppliers = signal<Supplier[]>([]);
  readonly items = signal<Item[]>([]);
  readonly po = signal<PurchaseOrderDetail | null>(null);

  id!: number;

  readonly form = this.fb.group({
    supplierId: this.fb.control<number | null>(null, [Validators.required]),
    deliveryLocation: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    expectedDate: this.fb.nonNullable.control(''),
    paymentTerms: this.fb.nonNullable.control(PAYMENT_TERMS[0], [Validators.required]),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<PoLineGroup>([], [Validators.minLength(1)]),
  });

  // mat-table needs a fresh array reference to re-render, so mirror the FormArray
  // into a signal whenever rows are added or removed.
  readonly lineGroups = signal<PoLineGroup[]>([]);

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.suppliersService.list().subscribe((s) => this.suppliers.set(s));
    this.itemsService.list().subscribe((i) => this.items.set(i));
    this.deliveryLocationsService.list().subscribe((locations) => this.deliveryLocations.set(locations));

    this.loadPo();
  }

  loadPo() {
    this.loading.set(true);
    this.poService.get(this.id).subscribe((po) => {
      this.po.set(po);
      const expected = parseDateString(po.expected_date);
      this.form.enable({ emitEvent: false });
      this.form.reset({
        supplierId: po.supplier_id,
        deliveryLocation: po.delivery_location,
        expectedDate: expected ? toDateString(expected) : '',
        paymentTerms: po.payment_terms,
        remarks: po.remarks ?? '',
      });
      this.lines.clear();
      po.lines.forEach((l) =>
        this.lines.push(
          createPoLineGroup(this.fb, {
            itemId: l.item_id,
            qtyOrdered: l.qty_ordered,
            rate: l.rate,
            taxPercent: l.tax_percent,
            discount: l.discount,
          }),
        ),
      );
      this.syncLines();
      // Only Draft POs are editable; every later status is read-only.
      if (po.status !== PO_STATUS.Draft) this.form.disable({ emitEvent: false });
      this.loading.set(false);
    });
  }

  statusLabelFor(status: PoStatus): string {
    return PO_STATUS_LABEL[status];
  }

  statusSlugFor(status: PoStatus): string {
    return PO_STATUS_SLUG[status];
  }

  get isDraft() {
    return this.po()?.status === PO_STATUS.Draft;
  }

  get supplierName() {
    return this.suppliers().find((s) => s.id === this.form.controls.supplierId.value)?.name ?? '—';
  }

  itemFor(itemId: number | null) {
    return this.items().find((i) => i.id === itemId) ?? null;
  }

  onItemChange(line: PoLineGroup) {
    const item = this.itemFor(line.controls.itemId.value);
    if (item) line.controls.rate.setValue(item.rate);
  }

  addLine() {
    const first = this.items()[0];
    this.lines.push(createPoLineGroup(this.fb, { itemId: first?.id ?? null, rate: first?.rate ?? 0, taxPercent: 5 }));
    this.syncLines();
  }

  removeLine(index: number) {
    this.lines.removeAt(index);
    this.syncLines();
  }

  private syncLines() {
    this.lineGroups.set([...this.lines.controls]);
  }

  lineTotal(line: PoLineGroup): number {
    return poLineTotal(line.getRawValue());
  }

  get totals() {
    return poTotals(this.lines.getRawValue());
  }

  get subtotal() {
    return this.totals.subtotal;
  }

  get totalDiscount() {
    return this.totals.totalDiscount;
  }

  get totalTax() {
    return this.totals.totalTax;
  }

  get grandTotal() {
    return this.totals.grandTotal;
  }

  private buildPayload() {
    const value = this.form.getRawValue();
    return {
      supplierId: value.supplierId!,
      deliveryLocation: value.deliveryLocation,
      expectedDate: value.expectedDate || undefined,
      paymentTerms: value.paymentTerms,
      remarks: value.remarks || undefined,
      lines: value.lines.map((l) => ({
        itemId: l.itemId!,
        qtyOrdered: l.qtyOrdered!,
        rate: l.rate!,
        taxPercent: l.taxPercent!,
        discount: l.discount!,
      })),
    };
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.lines.length) {
        this.snackBar.open('Add at least one line.', 'Dismiss', { duration: 3000 });
      }
      return;
    }
    this.saving.set(true);
    this.poService.update(this.id, this.buildPayload()).subscribe({
      next: (po) => {
        this.saving.set(false);
        this.snackBar.open(`${po.po_number} saved.`, 'Dismiss', { duration: 2500 });
        this.po.set(po);
        this.form.markAsPristine();
      },
      error: (err) => this.handleError(err),
    });
  }

  printPo() {
    const po = this.po();
    if (!po) return;
    // The printout is built from the saved PO, so unsaved draft edits would be silently left out.
    if (this.form.dirty) {
      this.snackBar.open('You have unsaved changes — save the draft before printing.', 'Dismiss', { duration: 3500 });
      return;
    }
    const supplier = this.suppliers().find((s) => s.id === po.supplier_id) ?? null;
    this.printService.printDocumentWithData('procurement/po', { po, supplier } satisfies PoPrintData);
  }

  sendForApproval() {
    const po = this.po();
    this.confirmService
      .ask({ title: 'Send for approval', message: `Send ${po?.po_number} for approval?` + (this.form.dirty ? '\n\nYou have unsaved changes to the lines. Save the draft first, they are not included.' : ''), confirmLabel: 'Send for approval' })
      .subscribe((confirmed) => {
        if (confirmed) this.runSendForApproval();
      });
  }

  private runSendForApproval() {
    this.saving.set(true);
    this.poService.sendForApproval(this.id).subscribe({
      next: () => {
        this.snackBar.open('Sent for approval.', 'Dismiss', { duration: 2500 });
        this.loadPo();
        this.saving.set(false);
      },
      error: (err) => this.handleError(err),
    });
  }

  approve() {
    const po = this.po();
    this.confirmService
      .ask({ title: 'Approve purchase order', message: `Approve ${po?.po_number}?`, confirmLabel: 'Approve' })
      .subscribe((confirmed) => {
        if (confirmed) this.runApprove();
      });
  }

  private runApprove() {
    this.saving.set(true);
    this.poService.approve(this.id, false).subscribe({
      next: () => {
        this.snackBar.open('Approved.', 'Dismiss', { duration: 2500 });
        this.loadPo();
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status !== 400) {
          this.handleError(err);
          return;
        }
        this.confirmService
          .ask({ title: 'Second approval required', message: `${err.error?.message}\n\nConfirm second approval?`, confirmLabel: 'Confirm approval' })
          .subscribe((confirmed) => {
            if (!confirmed) return;
            this.poService.approve(this.id, true).subscribe({
              next: () => {
                this.snackBar.open('Approved.', 'Dismiss', { duration: 2500 });
                this.loadPo();
              },
              error: (e) => this.handleError(e),
            });
          });
      },
    });
  }

  sendToSupplier() {
    const po = this.po();
    this.confirmService
      .ask({ title: 'Send to supplier', message: `Send ${po?.po_number} to ${po?.supplier_name}? Goods can be received against it once it is sent.`, confirmLabel: 'Send to supplier' })
      .subscribe((confirmed) => {
        if (confirmed) this.runSendToSupplier();
      });
  }

  private runSendToSupplier() {
    this.saving.set(true);
    this.poService.sendToSupplier(this.id).subscribe({
      next: () => {
        this.snackBar.open('Sent to supplier.', 'Dismiss', { duration: 2500 });
        this.loadPo();
        this.saving.set(false);
      },
      error: (err) => this.handleError(err),
    });
  }

  closePo() {
    const po = this.po();
    this.confirmService
      .ask({ title: 'Close purchase order', message: `Close ${po?.po_number}? No more goods can be received against it.`, confirmLabel: 'Close PO' })
      .subscribe((confirmed) => {
        if (confirmed) this.runClosePo();
      });
  }

  private runClosePo() {
    this.saving.set(true);
    this.poService.close(this.id).subscribe({
      next: () => {
        this.snackBar.open('Purchase order closed.', 'Dismiss', { duration: 2500 });
        this.loadPo();
        this.saving.set(false);
      },
      error: (err) => this.handleError(err),
    });
  }

  receiveAgainstPo() {
    this.router.navigate(['/grn/new'], { queryParams: { poId: this.id } });
  }

  private handleError(err: any) {
    this.saving.set(false);
    this.snackBar.open(err.error?.message ?? 'Something went wrong.', 'Dismiss', { duration: 4000 });
  }
}
