import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BatchesService } from 'app/shared/services/batches.service';
import type { StockSummaryRow } from 'app/shared/models/batch.model';

@Component({
  selector: 'app-stock-summary',
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule],
  templateUrl: './stock-summary.html',
})
export class StockSummary implements OnInit {
  private batchesService = inject(BatchesService);

  readonly columns = ['slno', 'item_name', 'usableQty', 'expiredQty', 'batchCount', 'nearestExpiryDays'];
  readonly rows = signal<StockSummaryRow[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.batchesService.list().subscribe((batches) => {
      const byItem = new Map<number, StockSummaryRow>();
      for (const b of batches) {
        if (b.qty_available <= 0) continue;
        let row = byItem.get(b.item_id);
        if (!row) {
          row = { item_id: b.item_id, item_name: b.item_name, unit: b.unit, usableQty: 0, expiredQty: 0, batchCount: 0, nearestExpiryDays: null };
          byItem.set(b.item_id, row);
        }
        if (b.days_to_expiry < 0) {
          row.expiredQty += b.qty_available;
        } else {
          row.usableQty += b.qty_available;
          row.batchCount += 1;
          if (row.nearestExpiryDays === null || b.days_to_expiry < row.nearestExpiryDays) row.nearestExpiryDays = b.days_to_expiry;
        }
      }
      this.rows.set(Array.from(byItem.values()).sort((a, b) => a.item_name.localeCompare(b.item_name)));
      this.loading.set(false);
    });
  }
}
