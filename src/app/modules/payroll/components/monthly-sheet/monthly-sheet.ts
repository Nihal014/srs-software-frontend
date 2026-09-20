import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayrollService } from 'app/shared/services/payroll.service';
import type { MonthSheet } from 'app/shared/models/payroll.model';

@Component({
  selector: 'app-monthly-sheet',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './monthly-sheet.html',
})
export class MonthlySheet implements OnInit {
  private payrollService = inject(PayrollService);

  readonly year = signal(new Date().getFullYear());
  readonly monthIndex = signal(new Date().getMonth()); // 0-11
  readonly sheet = signal<MonthSheet | null>(null);
  readonly loading = signal(true);

  readonly monthKey = computed(() => `${this.year()}-${String(this.monthIndex() + 1).padStart(2, '0')}`);
  readonly monthLabel = computed(() =>
    new Date(this.year(), this.monthIndex(), 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  );
  readonly days = computed(() => Array.from({ length: this.sheet()?.daysInMonth ?? 0 }, (_, i) => i + 1));

  ngOnInit() {
    this.load();
  }

  shift(delta: number) {
    const d = new Date(this.year(), this.monthIndex() + delta, 1);
    this.year.set(d.getFullYear());
    this.monthIndex.set(d.getMonth());
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.payrollService.getMonth(this.monthKey()).subscribe((sheet) => {
      this.sheet.set(sheet);
      this.loading.set(false);
    });
  }
}
