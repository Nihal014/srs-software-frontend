import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/services/auth.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { ProductInventoryService } from 'app/shared/services/product-inventory.service';
import { toDateString } from 'app/shared/utils/date.util';
import {
  PRODUCT_WASTAGE_REASON,
  PRODUCT_WASTAGE_REASON_LABEL,
  type ProductInventoryRow,
  type ProductWastageReason,
  type ProductWastageRow,
} from 'app/shared/models/product-inventory.model';

@Component({
  selector: 'app-product-wastage',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './product-wastage.html',
})
export class ProductWastage implements OnInit {
  private fb = inject(FormBuilder);
  private inventory = inject(ProductInventoryService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly reasons = Object.values(PRODUCT_WASTAGE_REASON) as ProductWastageReason[];
  readonly reasonText = (r: ProductWastageReason) => PRODUCT_WASTAGE_REASON_LABEL[r];
  readonly columns = ['wastage_number', 'wastage_date', 'location_name', 'product_name', 'qty', 'reason', 'value', 'remarks', 'created_by_name'];
  readonly rows = signal<ProductWastageRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly stock = signal<ProductInventoryRow[]>([]);
  readonly selLocation = signal<number | null>(null);
  readonly selProduct = signal<number | null>(null);
  readonly qty = signal<number>(0);

  readonly locations = computed(() => {
    const seen = new Map<number, string>();
    this.stock().forEach((r) => seen.set(r.location_id, r.location_name));
    return [...seen].map(([id, name]) => ({ id, name }));
  });
  readonly products = computed(() => this.stock().filter((r) => r.location_id === this.selLocation()));
  /** What is in hand of the chosen product at the chosen location. */
  readonly chosen = computed(() => this.products().find((r) => r.bundle_product_id === this.selProduct()) ?? null);
  readonly estimatedValue = computed(() => Math.round((this.chosen()?.unit_cost ?? 0) * (this.qty() || 0) * 100) / 100);

  readonly form = this.fb.group({
    locationId: this.fb.control<number | null>(null, Validators.required),
    bundleProductId: this.fb.control<number | null>(null, Validators.required),
    qty: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.001)]),
    reason: this.fb.control<ProductWastageReason | null>(null, Validators.required),
    wastageDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
  });

  ngOnInit() {
    this.load();
    this.form.controls.locationId.valueChanges.subscribe((id) => {
      this.selLocation.set(id);
      this.form.controls.bundleProductId.setValue(null);
    });
    this.form.controls.bundleProductId.valueChanges.subscribe((id) => {
      this.selProduct.set(id);
      const available = this.chosen()?.qty_available;
      this.form.controls.qty.setValidators([Validators.required, Validators.min(0.001), ...(available ? [Validators.max(Number(available))] : [])]);
      this.form.controls.qty.updateValueAndValidity();
    });
    this.form.controls.qty.valueChanges.subscribe((q) => this.qty.set(Number(q) || 0));
  }

  load() {
    this.loading.set(true);
    this.inventory.wastage(this.page(), this.pageSize()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  startCreate() {
    this.inventory.status().subscribe((s) => {
      this.stock.set(s.rows);
      this.form.reset({ locationId: null, bundleProductId: null, qty: null, reason: null, wastageDate: toDateString(new Date()), remarks: '' });
      this.creating.set(true);
    });
  }

  cancel() {
    this.creating.set(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields.', 'Dismiss', { duration: 3000 });
      return;
    }
    const v = this.form.getRawValue();
    const chosen = this.chosen();
    this.confirmService
      .ask({
        title: 'Record wastage',
        message: `Write off ${v.qty} ${chosen?.output_unit ?? ''} of ${chosen?.product_name ?? 'this product'} from ${chosen?.location_name ?? 'this location'} (about Rs ${this.estimatedValue().toFixed(2)} at cost)? The pieces leave stock and this can't be undone.`,
        confirmLabel: 'Record wastage',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.inventory
          .createWastage({
            locationId: v.locationId!,
            bundleProductId: v.bundleProductId!,
            qty: v.qty!,
            reason: v.reason!,
            wastageDate: v.wastageDate,
            remarks: v.remarks.trim() || undefined,
          })
          .subscribe({
            next: (w) => {
              this.saving.set(false);
              this.creating.set(false);
              this.snackBar.open(`${w.wastage_number} recorded.`, 'Dismiss', { duration: 3000 });
              this.page.set(1);
              this.load();
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this wastage.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
