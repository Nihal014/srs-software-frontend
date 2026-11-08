import { Component } from '@angular/core';
import { SalesTab } from '../sales-tab/sales-tab';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [SalesTab],
  template: '<div class="p-4"><app-sales-tab /></div>',
})
export class SalesPage {}
