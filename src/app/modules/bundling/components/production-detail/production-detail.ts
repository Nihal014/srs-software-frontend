import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import type { BundleProductionDetail } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatProgressSpinnerModule, MatIconModule, MatTooltipModule],
  templateUrl: './production-detail.html',
})
export class ProductionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productionsService = inject(BundleProductionsService);

  readonly consumptionColumns = ['slno', 'item_name', 'qty_consumed', 'rate_at_time', 'cost', 'batch_number', 'grn_number', 'po_number', 'supplier_name'];
  readonly production = signal<BundleProductionDetail | null>(null);
  readonly loading = signal(true);

  /** Ingredient cost per piece: the recipe's target when the run was recorded against what the run actually cost. */
  ingredientCheck(p: BundleProductionDetail) {
    if (p.target_material_cost_per_unit === null) return null;
    const target = Number(p.target_material_cost_per_unit);
    const actual = Math.round((Number(p.material_cost) / (Number(p.qty_produced) || 1)) * 100) / 100;
    return { target, actual, diff: Math.round((actual - target) * 100) / 100 };
  }

  /** What material cost means, for the info icon. */
  readonly materialInfo = 'Material cost is the total cost of the ingredients (raw materials) used in this production run. The Traceability table below lists each ingredient and the stock batch it came from, with the total at the bottom.';

  /** The unit cost split into its three parts, with each part's share of the whole for the bar. */
  breakdown(p: BundleProductionDetail) {
    const ingredients = Number(p.material_cost) / (Number(p.qty_produced) || 1);
    const labour = Number(p.labor_cost_per_unit);
    const other = Number(p.overhead_cost_per_unit);
    const total = ingredients + labour + other || 1;
    const pct = (n: number) => Math.round((n / total) * 1000) / 10;
    const unitCost = Number(p.unit_cost);
    const price = Number(p.selling_price);
    return {
      ingredients,
      labour,
      other,
      pctIngredients: pct(ingredients),
      pctLabour: pct(labour),
      pctOther: pct(other),
      margin: price - unitCost,
      marginPct: price > 0 ? Math.round(((price - unitCost) / price) * 1000) / 10 : null,
    };
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productionsService.findOne(id).subscribe((production) => {
      this.production.set(production);
      this.loading.set(false);
    });
  }
}
