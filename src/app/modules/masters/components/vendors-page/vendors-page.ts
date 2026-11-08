import { Component } from '@angular/core';
import { SuppliersMaster } from '../suppliers-master/suppliers-master';

@Component({
  selector: 'app-vendors-page',
  standalone: true,
  imports: [SuppliersMaster],
  template: '<div class="p-4"><app-suppliers-master /></div>',
})
export class VendorsPage {}
