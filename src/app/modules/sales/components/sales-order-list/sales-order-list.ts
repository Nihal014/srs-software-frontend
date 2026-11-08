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
import { STATUS_FILTER_ORDER, orderChip, orderLabel, type OrderStatus, type SalesOrderListRow } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './sales-order-list.html',
})
export class SalesOrderList implements OnInit {
  private salesDocs = inject(SalesDocsService);

  readonly statusOptions = STATUS_FILTER_ORDER;
  readonly label = orderLabel;
  readonly chip = orderChip;
  readonly columns = ['slno', 'order_number', 'customer_name', 'location_name', 'order_date', 'expected_date', 'delivered', 'total', 'status'];
  readonly rows = signal<SalesOrderListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly status = signal<OrderStatus | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.orders(this.page(), this.pageSize(), this.status()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onStatus(value: OrderStatus | null) {
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
