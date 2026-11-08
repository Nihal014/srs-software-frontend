import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ExpensesTab } from '../expenses-tab/expenses-tab';
import { ReceiptsTab } from '../receipts-tab/receipts-tab';
import { StockValueTab } from '../stock-value-tab/stock-value-tab';
import { AccountsSetup } from '../accounts-setup/accounts-setup';

@Component({
  selector: 'app-accounts-shell',
  standalone: true,
  imports: [MatTabsModule, ExpensesTab, ReceiptsTab, StockValueTab, AccountsSetup],
  templateUrl: './accounts-shell.html',
})
export class AccountsShell {}
