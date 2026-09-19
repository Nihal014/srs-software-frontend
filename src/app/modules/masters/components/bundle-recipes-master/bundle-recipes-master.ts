import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { ItemsService } from 'app/shared/services/items.service';
import type { BundleProduct, BundleProductDetail, UpsertBundleProductPayload } from 'app/shared/models/bundle.model';
import type { Item } from 'app/shared/models/item.model';

const UNITS = ['kg', 'pcs', 'g', 'l', 'ml'];

interface EditableBomLine {
  itemId: number | null;
  qtyPerUnit: number | null;
}

@Component({
  selector: 'app-bundle-recipes-master',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './bundle-recipes-master.html',
})
export class BundleRecipesMaster implements OnInit {
  private bundleProductsService = inject(BundleProductsService);
  private itemsService = inject(ItemsService);
  private snackBar = inject(MatSnackBar);

  readonly unitOptions = UNITS;
  readonly columns = ['name', 'output_unit', 'selling_price', 'status', 'edit', 'delete'];
  readonly bundles = signal<BundleProduct[]>([]);
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<BundleProduct | 'new' | null>(null);
  readonly saving = signal(false);

  code = '';
  name = '';
  outputUnit = UNITS[1];
  sellingPrice = 0;
  isActive = true;
  bomLines: EditableBomLine[] = [];

  ngOnInit() {
    this.itemsService.listAll().subscribe((items) => this.items.set(items));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bundleProductsService.listAll().subscribe((bundles) => {
      this.bundles.set(bundles);
      this.loading.set(false);
    });
  }

  itemUnit(itemId: number | null): string {
    return this.items().find((i) => i.id === itemId)?.unit ?? '';
  }

  startCreate() {
    this.editing.set('new');
    this.code = '';
    this.name = '';
    this.outputUnit = UNITS[1];
    this.sellingPrice = 0;
    this.isActive = true;
    this.bomLines = [{ itemId: null, qtyPerUnit: null }];
  }

  startEdit(bundle: BundleProduct) {
    this.bundleProductsService.findOne(bundle.id).subscribe((detail: BundleProductDetail) => {
      this.editing.set(bundle);
      this.code = detail.code;
      this.name = detail.name;
      this.outputUnit = detail.output_unit;
      this.sellingPrice = detail.selling_price;
      this.isActive = detail.is_active;
      this.bomLines = detail.bomLines.map((l) => ({ itemId: l.item_id, qtyPerUnit: l.qty_per_unit }));
    });
  }

  cancel() {
    this.editing.set(null);
  }

  addLine() {
    this.bomLines = [...this.bomLines, { itemId: null, qtyPerUnit: null }];
  }

  removeLine(index: number) {
    this.bomLines = this.bomLines.filter((_, i) => i !== index);
  }

  save() {
    if (!this.name.trim() || !this.code.trim()) {
      this.snackBar.open('Code and name are required.', 'Dismiss', { duration: 3000 });
      return;
    }
    const validLines = this.bomLines.filter((l) => l.itemId != null && l.qtyPerUnit != null && l.qtyPerUnit > 0);
    if (!validLines.length) {
      this.snackBar.open('Add at least one ingredient to the recipe.', 'Dismiss', { duration: 3000 });
      return;
    }

    const editing = this.editing();
    const payload: UpsertBundleProductPayload = {
      code: this.code.trim(),
      name: this.name.trim(),
      outputUnit: this.outputUnit,
      sellingPrice: this.sellingPrice,
      isActive: this.isActive,
      bomLines: validLines.map((l) => ({ itemId: l.itemId!, qtyPerUnit: l.qtyPerUnit! })),
    };

    this.saving.set(true);
    const request =
      editing === 'new' ? this.bundleProductsService.create(payload) : this.bundleProductsService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Recipe saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this recipe.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(bundle: BundleProduct) {
    if (!confirm(`Delete "${bundle.name}"? This can't be undone.`)) return;
    this.bundleProductsService.remove(bundle.id).subscribe({
      next: () => {
        this.snackBar.open('Recipe deleted.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Could not delete this recipe.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
