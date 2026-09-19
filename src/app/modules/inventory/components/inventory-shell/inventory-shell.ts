import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { StockSummary } from '../stock-summary/stock-summary';
import { BatchList } from '../batch-list/batch-list';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [MatTabsModule, StockSummary, BatchList],
  templateUrl: './inventory-shell.html',
})
export class InventoryShell {}
