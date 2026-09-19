import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import type { BundleProductionDetail } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './production-detail.html',
})
export class ProductionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productionsService = inject(BundleProductionsService);

  readonly consumptionColumns = ['item_name', 'qty_consumed', 'rate_at_time', 'cost', 'batch_number', 'grn_number', 'po_number', 'supplier_name'];
  readonly production = signal<BundleProductionDetail | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productionsService.findOne(id).subscribe((production) => {
      this.production.set(production);
      this.loading.set(false);
    });
  }
}
