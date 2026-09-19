import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import type { Supplier } from 'app/shared/models/supplier.model';
import type { Item } from 'app/shared/models/item.model';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import type { PurchaseOrderDetail } from 'app/shared/models/purchase-order.model';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];

interface EditableLine {
  itemId: number | null;
  qtyOrdered: number;
  rate: number;
  taxPercent: number;
  discount: number;
}

@Component({
  selector: 'app-po-create-dialog',
  standalone: true,
  imports: [
    FormsModule,
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

  readonly paymentTerms = PAYMENT_TERMS;
  readonly lineColumns = ['item', 'unit', 'qty', 'rate', 'tax', 'discount', 'total', 'remove'];

  readonly suppliers = signal<Supplier[]>([]);
  readonly items = signal<Item[]>([]);
  readonly deliveryLocations = signal<DeliveryLocation[]>([]);
  readonly saving = signal(false);

  supplierId: number | null = null;
  deliveryLocation = '';
  expectedDate = '';
  paymentTermsValue = PAYMENT_TERMS[0];
  remarks = '';
  lines: EditableLine[] = [];

  ngOnInit() {
    this.suppliersService.list().subscribe((s) => this.suppliers.set(s));
    this.itemsService.list().subscribe((i) => {
      this.items.set(i);
      this.addLine();
    });
    this.deliveryLocationsService.list().subscribe((locations) => {
      this.deliveryLocations.set(locations);
      this.deliveryLocation = locations[0]?.name ?? '';
    });
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
    // Reassign (not push) so mat-table's array differ — which can miss an
    // in-place mutation made from inside an async subscribe callback —
    // reliably picks up the new row.
    this.lines = [
      ...this.lines,
      { itemId: first?.id ?? null, qtyOrdered: 0, rate: first?.rate ?? 0, taxPercent: 5, discount: 0 },
    ];
  }

  removeLine(index: number) {
    this.lines = this.lines.filter((_, i) => i !== index);
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

  close() {
    this.dialogRef.close();
  }

  create() {
    if (!this.supplierId) {
      this.snackBar.open('Pick a supplier first.', 'Dismiss', { duration: 3000 });
      return;
    }
    const payload = {
      supplierId: this.supplierId,
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
