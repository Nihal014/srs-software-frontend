import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { SalesLinesEditor, createSalesLine, salesLinePayloads, salesLinesTotal, type SalesLineGroup } from 'app/shared/components/sales-lines-editor/sales-lines-editor';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { CustomersService } from 'app/shared/services/customers.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { BundleProduct } from 'app/shared/models/bundle.model';
import type { Customer } from 'app/shared/models/customer.model';
import type { SalesLocation } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-order-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DateField, SalesLinesEditor, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './sales-order-form.html',
})
export class SalesOrderForm implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private salesDocs = inject(SalesDocsService);
  private customersService = inject(CustomersService);
  private productsService = inject(BundleProductsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly customers = signal<Customer[]>([]);
  readonly locations = signal<SalesLocation[]>([]);
  readonly products = signal<BundleProduct[]>([]);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    customerId: this.fb.control<number | null>(null, Validators.required),
    salesLocationId: this.fb.control<number | null>(null),
    orderDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    expectedDate: this.fb.nonNullable.control(''),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<SalesLineGroup>([createSalesLine(this.fb)]),
  });

  ngOnInit() {
    this.customersService.list().subscribe((c) => this.customers.set(c));
    this.salesDocs.locations().subscribe((l) => this.locations.set(l));
    this.productsService.list().subscribe((p) => this.products.set(p));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields before saving.', 'Dismiss', { duration: 3000 });
      return;
    }
    const v = this.form.getRawValue();
    const customer = this.customers().find((c) => c.id === v.customerId)?.name ?? '';
    this.confirmService
      .ask({
        title: 'Create sales order',
        message: `Create a sales order for ${customer} worth Rs ${salesLinesTotal(this.form.controls.lines).toFixed(2)}?`,
        confirmLabel: 'Create order',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs
          .createOrder({
            customerId: v.customerId!,
            salesLocationId: v.salesLocationId,
            orderDate: v.orderDate,
            expectedDate: v.expectedDate || undefined,
            remarks: v.remarks.trim() || undefined,
            lines: salesLinePayloads(this.form.controls.lines),
          })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.order_number} created.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/sales/orders', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not create this order.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
