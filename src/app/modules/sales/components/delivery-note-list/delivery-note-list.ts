import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import type { DeliveryNoteListRow } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-delivery-note-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './delivery-note-list.html',
})
export class DeliveryNoteList implements OnInit {
  private salesDocs = inject(SalesDocsService);

  readonly columns = ['slno', 'dn_number', 'order_number', 'customer_name', 'delivery_date', 'product_names', 'qty_delivered', 'invoice'];
  readonly rows = signal<DeliveryNoteListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.deliveryNotes(this.page(), this.pageSize()).subscribe((res) => {
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
