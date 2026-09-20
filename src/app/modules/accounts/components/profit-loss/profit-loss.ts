import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import type { ProfitLoss as ProfitLossData } from 'app/shared/models/accounts.model';

@Component({
  selector: 'app-profit-loss',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, PercentPipe, MatButtonModule, MatProgressSpinnerModule, DateField],
  templateUrl: './profit-loss.html',
})
export class ProfitLoss implements OnInit {
  private api = inject(AccountsService);
  private fb = inject(FormBuilder);

  readonly report = signal<ProfitLossData | null>(null);
  readonly loading = signal(true);
  readonly filter = this.fb.nonNullable.group({ from: '', to: '' });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api.profitLoss(f.from || undefined, f.to || undefined).subscribe((report) => {
      this.report.set(report);
      this.loading.set(false);
    });
  }

  clear() {
    this.filter.reset();
    this.load();
  }
}
