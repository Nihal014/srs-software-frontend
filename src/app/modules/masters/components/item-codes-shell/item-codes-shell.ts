import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ItemsMaster } from '../items-master/items-master';
import { ItemCategoriesMaster } from '../item-categories-master/item-categories-master';

@Component({
  selector: 'app-item-codes-shell',
  standalone: true,
  imports: [MatTabsModule, ItemsMaster, ItemCategoriesMaster],
  templateUrl: './item-codes-shell.html',
})
export class ItemCodesShell {}
