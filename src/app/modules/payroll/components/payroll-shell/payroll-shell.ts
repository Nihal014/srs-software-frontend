import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DailyEntry } from '../daily-entry/daily-entry';
import { AuthService } from 'app/core/services/auth.service';
import { MonthlySheet } from '../monthly-sheet/monthly-sheet';
import { YearlySummary } from '../yearly-summary/yearly-summary';

@Component({
  selector: 'app-payroll-shell',
  standalone: true,
  imports: [MatTabsModule, DailyEntry, MonthlySheet, YearlySummary],
  templateUrl: './payroll-shell.html',
})
export class PayrollShell {
  readonly auth = inject(AuthService);
}
