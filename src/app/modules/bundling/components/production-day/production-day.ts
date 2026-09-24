import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { AuthService } from 'app/core/services/auth.service';
import type { BundleProductionDayDetail } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-day',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './production-day.html',
})
export class ProductionDay implements OnInit {
  private route = inject(ActivatedRoute);
  private productionsService = inject(BundleProductionsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly date = this.route.snapshot.paramMap.get('date') ?? '';
  readonly columns = ['slno', 'production_number', 'bundle_name', 'qty_produced', 'labor', 'unit_cost', 'selling_price', 'margin', 'action'];
  readonly day = signal<BundleProductionDayDetail | null>(null);
  readonly loading = signal(true);
  readonly recalculating = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.productionsService.getDay(this.date).subscribe({
      next: (day) => {
        this.day.set(day);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this day.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  /** Labour per unit currently shared across the payroll-based runs (null when there are none). */
  laborPerUnit(day: BundleProductionDayDetail): number | null {
    if (day.wages === null || day.payrollUnits <= 0) return null;
    return Math.round((day.wages / day.payrollUnits) * 100) / 100;
  }

  margin(row: { selling_price: number; unit_cost: number }): number {
    return Math.round((Number(row.selling_price) - Number(row.unit_cost)) * 100) / 100;
  }

  recalculate() {
    this.confirmService
      .ask({
        title: 'Recalculate labour',
        message: `Share this day's payroll again across its payroll-based runs? Runs whose labour was typed in by hand are not changed.`,
        confirmLabel: 'Recalculate',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.recalculating.set(true);
        this.productionsService.recalculateLabor(this.date).subscribe({
          next: () => {
            this.recalculating.set(false);
            this.snackBar.open('Labour recalculated.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.recalculating.set(false);
            this.snackBar.open(err.error?.message ?? 'Could not recalculate.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
