import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { AccountsSummary } from '../accounts-summary/accounts-summary';
import { ExpensesTab } from '../expenses-tab/expenses-tab';
import { ReceiptsTab } from '../receipts-tab/receipts-tab';
import { SalesTab } from '../sales-tab/sales-tab';
import { StockValueTab } from '../stock-value-tab/stock-value-tab';
import { CashBook } from '../cash-book/cash-book';
import { ProfitLoss } from '../profit-loss/profit-loss';
import { AccountsSetup } from '../accounts-setup/accounts-setup';

@Component({
  selector: 'app-accounts-shell',
  standalone: true,
  imports: [MatTabsModule, AccountsSummary, ExpensesTab, ReceiptsTab, SalesTab, StockValueTab, CashBook, ProfitLoss, AccountsSetup],
  templateUrl: './accounts-shell.html',
})
export class AccountsShell {}
