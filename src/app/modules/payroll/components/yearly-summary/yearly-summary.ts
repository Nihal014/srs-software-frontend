import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayrollService } from 'app/shared/services/payroll.service';
import type { YearSheet } from 'app/shared/models/payroll.model';

@Component({
  selector: 'app-yearly-summary',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './yearly-summary.html',
})
export class YearlySummary implements OnInit {
  private payrollService = inject(PayrollService);

  readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly year = signal(new Date().getFullYear());
  readonly sheet = signal<YearSheet | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.load();
  }

  shift(delta: number) {
    this.year.update((y) => y + delta);
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.payrollService.getYear(this.year()).subscribe((sheet) => {
      this.sheet.set(sheet);
      this.loading.set(false);
    });
  }
}
