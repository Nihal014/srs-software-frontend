import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BatchesService } from 'app/shared/services/batches.service';
import { expiryStatusLabel, expiryStatusSlug, type Batch } from 'app/shared/models/batch.model';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './batch-list.html',
})
export class BatchList implements OnInit {
  private batchesService = inject(BatchesService);

  readonly columns = [
    'batch_number',
    'item_name',
    'qty_available',
    'mfg_date',
    'expiry_date',
    'status',
    'grn_number',
  ];
  readonly rows = signal<Batch[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.batchesService.list().subscribe((batches) => {
      this.rows.set(batches);
      this.loading.set(false);
    });
  }

  statusSlug(row: Batch): string {
    return expiryStatusSlug(row.days_to_expiry, row.is_quarantined);
  }

  statusLabel(row: Batch): string {
    return expiryStatusLabel(row.days_to_expiry, row.is_quarantined);
  }
}
