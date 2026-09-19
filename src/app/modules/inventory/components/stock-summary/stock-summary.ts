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

  readonly columns = ['item_name', 'totalQtyAvailable', 'batchCount', 'nearestExpiryDays'];
  readonly rows = signal<StockSummaryRow[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.batchesService.list().subscribe((batches) => {
      const byItem = new Map<number, StockSummaryRow>();
      for (const b of batches) {
        if (b.qty_available <= 0) continue;
        const existing = byItem.get(b.item_id);
        if (existing) {
          existing.totalQtyAvailable += b.qty_available;
          existing.batchCount += 1;
          if (existing.nearestExpiryDays === null || b.days_to_expiry < existing.nearestExpiryDays) {
            existing.nearestExpiryDays = b.days_to_expiry;
          }
        } else {
          byItem.set(b.item_id, {
            item_id: b.item_id,
            item_name: b.item_name,
            unit: b.unit,
            totalQtyAvailable: b.qty_available,
            batchCount: 1,
            nearestExpiryDays: b.days_to_expiry,
          });
        }
      }
      this.rows.set(Array.from(byItem.values()).sort((a, b) => a.item_name.localeCompare(b.item_name)));
      this.loading.set(false);
    });
  }
}
