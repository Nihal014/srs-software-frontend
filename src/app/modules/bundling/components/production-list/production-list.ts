import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import type { BundleProductionRow } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './production-list.html',
})
export class ProductionList implements OnInit {
  private productionsService = inject(BundleProductionsService);

  readonly columns = [
    'slno',
    'production_number',
    'bundle_name',
    'produced_date',
    'qty_produced',
    'unit_cost',
    'selling_price',
    'action',
  ];
  readonly rows = signal<BundleProductionRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.productionsService.listPaged(this.page(), this.pageSize()).subscribe((res) => {
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
