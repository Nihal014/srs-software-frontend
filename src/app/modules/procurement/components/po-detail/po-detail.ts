import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PoService } from '../../po.service';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import { ItemsService } from 'app/shared/services/items.service';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
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

interface EditableLine {
  itemId: number | null;
  qtyOrdered: number;
  rate: number;
  taxPercent: number;
  discount: number;
}

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DecimalPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
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

  readonly deliveryLocations = signal<DeliveryLocation[]>([]);
  readonly paymentTerms = PAYMENT_TERMS;
  readonly PO_STATUS = PO_STATUS;
  readonly lineColumns = ['item', 'unit', 'qty', 'rate', 'tax', 'discount', 'total', 'remove'];
  readonly grnColumns = ['grn_number', 'received_date', 'qty_received', 'qty_accepted', 'qty_rejected', 'batch_numbers'];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly suppliers = signal<Supplier[]>([]);
  readonly items = signal<Item[]>([]);
  readonly po = signal<PurchaseOrderDetail | null>(null);

  id: number | null = null;
  isNew = true;

  supplierId: number | null = null;
  deliveryLocation = '';
  expectedDate = '';
  paymentTermsValue = PAYMENT_TERMS[0];
  remarks = '';
  lines: EditableLine[] = [];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam;
    this.id = idParam ? Number(idParam) : null;

    this.suppliersService.list().subscribe((s) => this.suppliers.set(s));
    this.itemsService.list().subscribe((i) => this.items.set(i));
    this.deliveryLocationsService.list().subscribe((locations) => {
      this.deliveryLocations.set(locations);
      if (this.isNew && !this.deliveryLocation) {
        this.deliveryLocation = locations[0]?.name ?? '';
      }
    });

    if (this.isNew) {
      this.addLine();
      this.loading.set(false);
    } else {
      this.loadPo();
    }
  }

  loadPo() {
    if (!this.id) return;
    this.loading.set(true);
    this.poService.get(this.id).subscribe((po) => {
      this.po.set(po);
      this.supplierId = po.supplier_id;
      this.deliveryLocation = po.delivery_location;
      this.expectedDate = po.expected_date ? po.expected_date.slice(0, 10) : '';
      this.paymentTermsValue = po.payment_terms;
      this.remarks = po.remarks ?? '';
      this.lines = po.lines.map((l) => ({
        itemId: l.item_id,
        qtyOrdered: l.qty_ordered,
        rate: l.rate,
        taxPercent: l.tax_percent,
        discount: l.discount,
      }));
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
    return this.isNew || this.po()?.status === PO_STATUS.Draft;
  }

  itemFor(itemId: number | null) {
    return this.items().find((i) => i.id === itemId) ?? null;
  }

  onItemChange(line: EditableLine) {
    const item = this.itemFor(line.itemId);
    if (item) line.rate = item.rate;
  }

  addLine() {
    const first = this.items()[0];
    this.lines.push({
      itemId: first?.id ?? null,
      qtyOrdered: 0,
      rate: first?.rate ?? 0,
      taxPercent: 5,
      discount: 0,
    });
  }

  removeLine(index: number) {
    this.lines.splice(index, 1);
  }

  lineTotal(line: EditableLine): number {
    const gross = (line.qtyOrdered || 0) * (line.rate || 0) - (line.discount || 0);
    return gross + (gross * (line.taxPercent || 0)) / 100;
  }

  get subtotal() {
    return this.lines.reduce((a, l) => a + (l.qtyOrdered || 0) * (l.rate || 0), 0);
  }

  get totalDiscount() {
    return this.lines.reduce((a, l) => a + (l.discount || 0), 0);
  }

  get totalTax() {
    return this.lines.reduce((a, l) => a + (this.lineTotal(l) - (l.qtyOrdered || 0) * (l.rate || 0) + (l.discount || 0)), 0);
  }

  get grandTotal() {
    return this.lines.reduce((a, l) => a + this.lineTotal(l), 0);
  }

  private buildPayload() {
    return {
      supplierId: this.supplierId!,
      deliveryLocation: this.deliveryLocation,
      expectedDate: this.expectedDate || undefined,
      paymentTerms: this.paymentTermsValue,
      remarks: this.remarks || undefined,
      lines: this.lines
        .filter((l) => l.itemId)
        .map((l) => ({
          itemId: l.itemId!,
          qtyOrdered: l.qtyOrdered,
          rate: l.rate,
          taxPercent: l.taxPercent,
          discount: l.discount,
        })),
    };
  }

  save() {
    if (!this.supplierId) {
      this.snackBar.open('Pick a supplier first.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const payload = this.buildPayload();
    const request = this.isNew ? this.poService.create(payload) : this.poService.update(this.id!, payload);
    request.subscribe({
      next: (po) => {
        this.saving.set(false);
        this.snackBar.open(`${po.po_number} saved.`, 'Dismiss', { duration: 2500 });
        this.router.navigate(['/procurement', po.id]);
      },
      error: (err) => this.handleError(err),
    });
  }

  sendForApproval() {
    if (!this.id) return;
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
    if (!this.id) return;
    this.saving.set(true);
    this.poService.approve(this.id, false).subscribe({
      next: () => {
        this.snackBar.open('Approved.', 'Dismiss', { duration: 2500 });
        this.loadPo();
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 400 && confirm(err.error?.message + '\n\nConfirm second approval?')) {
          this.poService.approve(this.id!, true).subscribe({
            next: () => {
              this.snackBar.open('Approved.', 'Dismiss', { duration: 2500 });
              this.loadPo();
            },
            error: (e) => this.handleError(e),
          });
        }
      },
    });
  }

  sendToSupplier() {
    if (!this.id) return;
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
    if (!this.id) return;
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
    if (!this.id) return;
    this.router.navigate(['/grn/new'], { queryParams: { poId: this.id } });
  }

  private handleError(err: any) {
    this.saving.set(false);
    this.snackBar.open(err.error?.message ?? 'Something went wrong.', 'Dismiss', { duration: 4000 });
  }
}
