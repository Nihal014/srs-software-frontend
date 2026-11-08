import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { ProductInventoryService } from 'app/shared/services/product-inventory.service';
import type { ProductLotRow, ProductStockStatus } from 'app/shared/models/product-inventory.model';

@Component({
  selector: 'app-product-stock-status',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './product-stock-status.html',
})
export class ProductStockStatusTab implements OnInit {
  private inventory = inject(ProductInventoryService);

  readonly statusColumns = ['product', 'location', 'qty', 'unit_cost', 'value'];
  readonly lotColumns = ['lot', 'product', 'location', 'produced', 'age', 'made', 'qty', 'unit_cost', 'value'];

  readonly status = signal<ProductStockStatus | null>(null);
  readonly loading = signal(true);
  readonly lots = signal<ProductLotRow[]>([]);
  readonly lotPage = signal(1);
  readonly lotPageSize = signal(25);
  readonly lotTotal = signal(0);

  readonly totalQty = computed(() => (this.status()?.rows ?? []).reduce((a, r) => a + Number(r.qty_available), 0));
  readonly totalValue = computed(() => (this.status()?.rows ?? []).reduce((a, r) => a + Number(r.stock_value), 0));
  readonly inTransitQty = computed(() => (this.status()?.inTransit ?? []).reduce((a, r) => a + Number(r.qty), 0));

  ngOnInit() {
    this.inventory.status().subscribe((s) => {
      this.status.set(s);
      this.loading.set(false);
    });
    this.loadLots();
  }

  loadLots() {
    this.inventory.lots(this.lotPage(), this.lotPageSize()).subscribe((res) => {
      this.lots.set(res.rows);
      this.lotTotal.set(res.total);
    });
  }

  onLotPage(e: PageEvent) {
    this.lotPage.set(e.pageIndex + 1);
    this.lotPageSize.set(e.pageSize);
    this.loadLots();
  }
}
