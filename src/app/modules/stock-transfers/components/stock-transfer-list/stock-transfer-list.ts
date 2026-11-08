import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { StockTransfersService } from 'app/shared/services/stock-transfers.service';
import {
  STOCK_TRANSFER_STATUS_CHIP,
  STOCK_TRANSFER_STATUS_LABEL,
  type StockTransferListRow,
  type StockTransferStatus,
} from 'app/shared/models/stock-transfer.model';

@Component({
  selector: 'app-stock-transfer-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './stock-transfer-list.html',
})
export class StockTransferList implements OnInit {
  private transfersService = inject(StockTransfersService);

  readonly statusText = (status: StockTransferStatus) => STOCK_TRANSFER_STATUS_LABEL[status];
  readonly statusChip = (status: StockTransferStatus) => STOCK_TRANSFER_STATUS_CHIP[status];
  readonly columns = ['slno', 'transfer_number', 'receipt_number', 'from_location_name', 'to_location_name', 'transfer_date', 'item_names', 'status'];
  readonly rows = signal<StockTransferListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.transfersService.listPaged(this.page(), this.pageSize()).subscribe((res) => {
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
