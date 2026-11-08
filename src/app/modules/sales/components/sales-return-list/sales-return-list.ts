import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import type { SalesReturnListRow } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './sales-return-list.html',
})
export class SalesReturnList implements OnInit {
  private salesDocs = inject(SalesDocsService);

  readonly columns = ['slno', 'return_number', 'invoice_number', 'customer_name', 'return_date', 'product_names', 'total_amount'];
  readonly rows = signal<SalesReturnListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.returns(this.page(), this.pageSize()).subscribe((res) => {
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
}
