import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SalesInvoiceList } from '../sales-invoice-list/sales-invoice-list';
import { SalesTab } from '../sales-tab/sales-tab';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [MatTabsModule, SalesInvoiceList, SalesTab],
  template: `
    <div class="p-4">
      <!-- matTabContent renders a tab only while it is open, so each list reloads fresh. -->
      <mat-tab-group animationDuration="0ms">
        <mat-tab label="Invoices">
          <ng-template matTabContent><div class="pt-4"><app-sales-invoice-list /></div></ng-template>
        </mat-tab>
        <mat-tab label="Sales Register">
          <ng-template matTabContent><div class="pt-4"><app-sales-tab /></div></ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class InvoicesPage {}
