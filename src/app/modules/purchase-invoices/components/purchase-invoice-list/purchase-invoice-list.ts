import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { PurchaseInvoicesService } from 'app/shared/services/purchase-invoices.service';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import type { Supplier } from 'app/shared/models/supplier.model';
import {
  PAYMENT_STATUS_FILTER_OPTIONS,
  paymentStatusChip,
  paymentStatusLabel,
  type InvoiceSummary,
  type PaymentStatusFilter,
  type PurchaseInvoiceListRow,
} from 'app/shared/models/purchase-invoice.model';

@Component({
  selector: 'app-purchase-invoice-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './purchase-invoice-list.html',
})
export class PurchaseInvoiceList implements OnInit {
  private invoicesService = inject(PurchaseInvoicesService);
  private suppliersService = inject(SuppliersService);

  readonly statusOptions = PAYMENT_STATUS_FILTER_OPTIONS;
  readonly statusText = paymentStatusLabel;
  readonly statusChip = paymentStatusChip;
  readonly columns = ['slno', 'invoice_number', 'supplier_invoice_no', 'supplier_name', 'grn_number', 'invoice_date', 'due_date', 'amount', 'paid_amount', 'outstanding', 'status'];

  readonly rows = signal<PurchaseInvoiceListRow[]>([]);
  readonly summary = signal<InvoiceSummary | null>(null);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly status = signal<PaymentStatusFilter | null>(null);
  readonly supplierId = signal<number | null>(null);

  ngOnInit() {
    this.suppliersService.listAll().subscribe((suppliers) => this.suppliers.set(suppliers));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.invoicesService.summary(this.supplierId()).subscribe((summary) => this.summary.set(summary));
    this.invoicesService.listPaged(this.page(), this.pageSize(), this.status(), this.supplierId()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onFilter() {
    this.page.set(1);
    this.load();
  }

  onStatus(value: PaymentStatusFilter | null) {
    this.status.set(value);
    this.onFilter();
  }

  onSupplier(value: number | null) {
    this.supplierId.set(value);
    this.onFilter();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }
}
