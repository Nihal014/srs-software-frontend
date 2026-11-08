import { Component } from '@angular/core';
import { DeliveryLocationsMaster } from '../delivery-locations-master/delivery-locations-master';

@Component({
  selector: 'app-stock-locations-page',
  standalone: true,
  imports: [DeliveryLocationsMaster],
  template: '<div class="p-4"><app-delivery-locations-master /></div>',
})
export class StockLocationsPage {}
