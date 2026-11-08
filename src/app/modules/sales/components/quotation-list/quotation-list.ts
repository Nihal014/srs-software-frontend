import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import {
  STATUS_FILTER_QUOTATION,
  quotationChip,
  quotationLabel,
  type QuotationListRow,
  type QuotationStatus,
} from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-quotation-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './quotation-list.html',
})
export class QuotationList implements OnInit {
  private salesDocs = inject(SalesDocsService);

  readonly statusOptions = STATUS_FILTER_QUOTATION;
  readonly label = quotationLabel;
  readonly chip = quotationChip;
  readonly columns = ['slno', 'quotation_number', 'customer_name', 'location_name', 'quotation_date', 'valid_until', 'total', 'status'];
  readonly rows = signal<QuotationListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly status = signal<QuotationStatus | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.quotations(this.page(), this.pageSize(), this.status()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onStatus(value: QuotationStatus | null) {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }
}
