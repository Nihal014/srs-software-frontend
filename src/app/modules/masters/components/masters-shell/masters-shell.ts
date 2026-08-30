import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ItemsMaster } from '../items-master/items-master';
import { SuppliersMaster } from '../suppliers-master/suppliers-master';
import { DeliveryLocationsMaster } from '../delivery-locations-master/delivery-locations-master';

@Component({
  selector: 'app-masters-shell',
  standalone: true,
  imports: [MatTabsModule, ItemsMaster, SuppliersMaster, DeliveryLocationsMaster],
  templateUrl: './masters-shell.html',
})
export class MastersShell {}
