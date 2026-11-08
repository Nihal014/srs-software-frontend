import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { CustomersService } from 'app/shared/services/customers.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import type { Customer } from 'app/shared/models/customer.model';
import {
  PAYMENT_STATUS_FILTER_OPTIONS,
  paymentStatusChip,
  paymentStatusLabel,
  type InvoiceSummary,
  type PaymentStatusFilter,
} from 'app/shared/models/purchase-invoice.model';
import type { SalesInvoiceListRow } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-invoice-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './sales-invoice-list.html',
})
export class SalesInvoiceList implements OnInit {
  private salesDocs = inject(SalesDocsService);
  private customersService = inject(CustomersService);

  readonly statusOptions = PAYMENT_STATUS_FILTER_OPTIONS;
  readonly statusText = paymentStatusLabel;
  readonly statusChip = paymentStatusChip;
  readonly columns = ['slno', 'invoice_number', 'customer_name', 'invoice_date', 'due_date', 'amount', 'paid_amount', 'credited_amount', 'outstanding', 'status'];

  readonly rows = signal<SalesInvoiceListRow[]>([]);
  readonly summary = signal<InvoiceSummary | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly status = signal<PaymentStatusFilter | null>(null);
  readonly customerId = signal<number | null>(null);

  ngOnInit() {
    this.customersService.listAll().subscribe((c) => this.customers.set(c));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.invoiceSummary(this.customerId()).subscribe((s) => this.summary.set(s));
    this.salesDocs.invoices(this.page(), this.pageSize(), this.status(), this.customerId()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onStatus(value: PaymentStatusFilter | null) {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onCustomer(value: number | null) {
    this.customerId.set(value);
    this.page.set(1);
    this.load();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }
}
