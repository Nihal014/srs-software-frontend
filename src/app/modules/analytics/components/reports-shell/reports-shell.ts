import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { AccountsSummary } from '../accounts-summary/accounts-summary';
import { CashBook } from '../cash-book/cash-book';
import { ProfitLoss } from '../profit-loss/profit-loss';

@Component({
  selector: 'app-reports-shell',
  standalone: true,
  imports: [MatTabsModule, AccountsSummary, CashBook, ProfitLoss],
  templateUrl: './reports-shell.html',
})
export class ReportsShell {}
