import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { ProductTransfersService } from 'app/shared/services/product-transfers.service';
import {
  PRODUCT_TRANSFER_STATUS_CHIP,
  PRODUCT_TRANSFER_STATUS_LABEL,
  type ProductStockRow,
  type ProductTransferListRow,
  type ProductTransferStatus,
} from 'app/shared/models/product-transfer.model';

@Component({
  selector: 'app-product-transfer-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './product-transfer-list.html',
})
export class ProductTransferList implements OnInit {
  private transfersService = inject(ProductTransfersService);

  readonly statusText = (status: ProductTransferStatus) => PRODUCT_TRANSFER_STATUS_LABEL[status];
  readonly statusChip = (status: ProductTransferStatus) => PRODUCT_TRANSFER_STATUS_CHIP[status];
  readonly columns = ['slno', 'transfer_number', 'receipt_number', 'from_location_name', 'to_location_name', 'transfer_date', 'product_names', 'status'];
  readonly rows = signal<ProductTransferListRow[]>([]);
  readonly stock = signal<ProductStockRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.transfersService.stock().subscribe((rows) => this.stock.set(rows));
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
