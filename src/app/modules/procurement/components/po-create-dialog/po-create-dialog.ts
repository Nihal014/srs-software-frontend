import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PoService } from '../../po.service';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import { ItemsService } from 'app/shared/services/items.service';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { createPoLineGroup, poLineTotal, poTotals, type PoLineGroup } from 'app/shared/forms/po-line.form';
import type { Supplier } from 'app/shared/models/supplier.model';
import type { Item } from 'app/shared/models/item.model';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import type { PurchaseOrderDetail } from 'app/shared/models/purchase-order.model';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];

@Component({
  selector: 'app-po-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DateField,
    DecimalPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './po-create-dialog.html',
  styleUrl: './po-create-dialog.scss',
})
export class PoCreateDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<PoCreateDialog>);
  private poService = inject(PoService);
  private suppliersService = inject(SuppliersService);
  private itemsService = inject(ItemsService);
  private deliveryLocationsService = inject(DeliveryLocationsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly paymentTerms = PAYMENT_TERMS;
  readonly lineColumns = ['item', 'unit', 'qty', 'rate', 'tax', 'discount', 'total', 'remove'];

  readonly suppliers = signal<Supplier[]>([]);
  readonly items = signal<Item[]>([]);
  readonly deliveryLocations = signal<DeliveryLocation[]>([]);
  readonly saving = signal(false);

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
    this.suppliersService.list().subscribe((s) => this.suppliers.set(s));
    this.itemsService.list().subscribe((i) => {
      this.items.set(i);
      this.addLine();
    });
    this.deliveryLocationsService.list().subscribe((locations) => {
      this.deliveryLocations.set(locations);
      this.form.controls.deliveryLocation.setValue(locations[0]?.name ?? '');
    });
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
    this.lines.push(createPoLineGroup(this.fb, { itemId: first?.id ?? null, rate: first?.rate ?? 0, taxPercent: 0 }));
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

  close() {
    this.dialogRef.close();
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.lines.length) {
        this.snackBar.open('Add at least one line.', 'Dismiss', { duration: 3000 });
      }
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
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

    this.saving.set(true);
    this.poService.create(payload).subscribe({
      next: (po: PurchaseOrderDetail) => {
        this.saving.set(false);
        this.snackBar.open(`${po.po_number} created.`, 'Dismiss', { duration: 2500 });
        this.dialogRef.close(po);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not create this purchase order.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
