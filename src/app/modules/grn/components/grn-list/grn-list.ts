import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GrnService } from '../../grn.service';
import type { GrnListRow } from 'app/shared/models/grn.model';

@Component({
  selector: 'app-grn-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './grn-list.html',
})
export class GrnList implements OnInit {
  private grnService = inject(GrnService);

  readonly displayedColumns = [
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

  ngOnInit() {
    this.grnService.list().subscribe((rows) => {
      this.rows.set(rows);
      this.loading.set(false);
    });
  }
}
