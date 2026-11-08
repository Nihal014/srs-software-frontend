import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ProductStockStatusTab } from '../product-stock-status/product-stock-status';
import { ProductStockAudit } from '../product-stock-audit/product-stock-audit';
import { ProductWastage } from '../product-wastage/product-wastage';

@Component({
  selector: 'app-product-inventory-shell',
  standalone: true,
  imports: [MatTabsModule, ProductStockStatusTab, ProductStockAudit, ProductWastage],
  templateUrl: './product-inventory-shell.html',
})
export class ProductInventoryShell {}
