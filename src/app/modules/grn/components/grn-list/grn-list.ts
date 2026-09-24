import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { GrnService } from '../../grn.service';
import type { GrnListRow } from 'app/shared/models/grn.model';

@Component({
  selector: 'app-grn-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatTableModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './grn-list.html',
})
export class GrnList implements OnInit {
  private grnService = inject(GrnService);

  readonly displayedColumns = [
    'slno',
    'grn_number',
    'po_number',
    'supplier_name',
    'received_date',
    'qty_received',
    'qty_accepted',
    'qty_rejected',
    'batch_numbers',
  ];
  readonly rows = signal<GrnListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.grnService.listPaged(this.page(), this.pageSize()).subscribe((res) => {
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
