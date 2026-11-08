import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import { BatchesService } from 'app/shared/services/batches.service';
import { AuthService } from 'app/core/services/auth.service';
import { BATCH_ADJUSTMENT_REASON, expiryStatusLabel, expiryStatusSlug, type Batch } from 'app/shared/models/batch.model';
import { BatchAdjustDialog, type BatchAdjustDialogData } from '../batch-adjust-dialog/batch-adjust-dialog';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './batch-list.html',
})
export class BatchList implements OnInit {
  private batchesService = inject(BatchesService);
  private dialog = inject(MatDialog);
  private locationsService = inject(DeliveryLocationsService);
  readonly auth = inject(AuthService);

  readonly columns = [
    'slno',
    'batch_number',
    'item_name',
    'category',
    'location',
    'qty_available',
    'mfg_date',
    'expiry_date',
    'status',
    'grn_number',
    'action',
  ];
  readonly rows = signal<Batch[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly locations = signal<DeliveryLocation[]>([]);
  readonly locationId = signal<number | null>(null);

  ngOnInit() {
    this.locationsService.listAll().subscribe((locations) => this.locations.set(locations));
    this.load();
  }

  onLocation(id: number | null) {
    this.locationId.set(id);
    this.page.set(1);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.batchesService.listPaged(this.page(), this.pageSize(), this.locationId()).subscribe((res) => {
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

  statusSlug(row: Batch): string {
    return expiryStatusSlug(row.days_to_expiry, row.is_quarantined);
  }

  statusLabel(row: Batch): string {
    return expiryStatusLabel(row.days_to_expiry, row.is_quarantined);
  }

  /** Already past its expiry date and still showing stock — the "Write off" shortcut applies. */
  isExpired(row: Batch): boolean {
    return row.days_to_expiry < 0 && row.qty_available > 0;
  }

  private openDialog(data: BatchAdjustDialogData) {
    this.dialog
      .open(BatchAdjustDialog, { panelClass: ['rb-dialog-container', 'w-[480px]', 'max-w-[95vw]'], autoFocus: false, data })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.load();
      });
  }

  adjust(row: Batch) {
    this.openDialog({ batch: row });
  }

  writeOff(row: Batch) {
    this.openDialog({
      batch: row,
      title: 'Write off expired stock',
      preset: { direction: 'remove', qty: row.qty_available, reason: BATCH_ADJUSTMENT_REASON.Expired },
    });
  }
}
