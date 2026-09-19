import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import type { BundleProductionRow } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './production-list.html',
})
export class ProductionList implements OnInit {
  private productionsService = inject(BundleProductionsService);

  readonly columns = [
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

  ngOnInit() {
    this.productionsService.list().subscribe((rows) => {
      this.rows.set(rows);
      this.loading.set(false);
    });
  }
}
