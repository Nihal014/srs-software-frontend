import { Component } from '@angular/core';
import { CustomersMaster } from '../customers-master/customers-master';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CustomersMaster],
  template: '<div class="p-4"><app-customers-master /></div>',
})
export class CustomersPage {}
