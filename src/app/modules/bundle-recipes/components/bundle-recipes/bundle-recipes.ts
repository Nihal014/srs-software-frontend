import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { ItemsService } from 'app/shared/services/items.service';
import type { BundleProduct, BundleProductDetail, UpsertBundleProductPayload } from 'app/shared/models/bundle.model';
import type { Item } from 'app/shared/models/item.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

const UNITS = ['kg', 'pcs', 'g', 'l', 'ml'];

@Component({
  selector: 'app-bundle-recipes',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatTooltipModule],
  templateUrl: './bundle-recipes.html',
})
export class BundleRecipes implements OnInit {
  private confirmService = inject(ConfirmService);
  private bundleProductsService = inject(BundleProductsService);
  private itemsService = inject(ItemsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly unitOptions = UNITS;
  readonly columns = ['slno', 'name', 'output_unit', 'target_cost', 'selling_price', 'margin', 'status', 'edit', 'delete'];
  readonly bundles = signal<BundleProduct[]>([]);
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<BundleProduct | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    outputUnit: [UNITS[1], [Validators.required]],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    isActive: true,
    bomLines: this.fb.array([this.newLine()], [Validators.minLength(1)]),
  });

  get bomLines() {
    return this.form.controls.bomLines;
  }

  private newLine(itemId: number | null = null, qtyPerUnit: number | null = null) {
    return this.fb.group({
      itemId: this.fb.control<number | null>(itemId, [Validators.required]),
      qtyPerUnit: this.fb.control<number | null>(qtyPerUnit, [Validators.required, Validators.min(0.000001)]),
    });
  }

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

  itemRate(itemId: number | null | undefined): number {
    return this.items().find((i) => i.id === itemId)?.rate ?? 0;
  }

  /** What one piece costs in this ingredient: qty per piece x the item's current rate. */
  lineCost(line: { value: Partial<{ itemId: number | null; qtyPerUnit: number | null }> }): number {
    return Math.round((line.value.qtyPerUnit ?? 0) * this.itemRate(line.value.itemId) * 100) / 100;
  }

  /** The recipe's target cost per piece: all ingredient costs (quantity x current rate) added up. */
  get targetCost(): number {
    return Math.round(this.bomLines.controls.reduce((a, l) => a + this.lineCost(l), 0) * 100) / 100;
  }

  get margin(): number {
    return Math.round((this.form.controls.sellingPrice.value - this.targetCost) * 100) / 100;
  }

  get marginPercent(): number | null {
    const price = this.form.controls.sellingPrice.value;
    return price > 0 ? Math.round((this.margin / price) * 1000) / 10 : null;
  }

  /** Ingredients picked but never bought have no rate yet, so their cost reads as 0. */
  get hasUnratedIngredient(): boolean {
    return this.bomLines.controls.some((l) => l.value.itemId !== null && this.itemRate(l.value.itemId) === 0);
  }

  margin_of(bundle: BundleProduct): number {
    return Math.round((bundle.selling_price - bundle.target_cost) * 100) / 100;
  }

  itemUnit(itemId: number | null): string {
    return this.items().find((i) => i.id === itemId)?.unit ?? '';
  }

  itemLabel(itemId: number | null): string {
    const item = this.items().find((i) => i.id === itemId);
    return item ? `${item.name} (${item.unit})` : '';
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ code: '', name: '', outputUnit: UNITS[1], sellingPrice: 0, isActive: true });
    this.bomLines.clear();
    this.bomLines.push(this.newLine());
  }

  startEdit(bundle: BundleProduct) {
    this.bundleProductsService.findOne(bundle.id).subscribe((detail: BundleProductDetail) => {
      this.editing.set(bundle);
      this.form.reset({
        code: detail.code,
        name: detail.name,
        outputUnit: detail.output_unit,
        sellingPrice: detail.selling_price,
        isActive: !!detail.is_active,
      });
      this.bomLines.clear();
      detail.bomLines.forEach((l) => this.bomLines.push(this.newLine(l.item_id, l.qty_per_unit)));
    });
  }

  cancel() {
    this.editing.set(null);
  }

  addLine() {
    this.bomLines.push(this.newLine());
  }

  removeLine(index: number) {
    this.bomLines.removeAt(index);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.bomLines.length) {
        this.snackBar.open('Add at least one ingredient to the recipe.', 'Dismiss', { duration: 3000 });
      }
      return;
    }

    const editing = this.editing();
    const value = this.form.getRawValue();
    const payload: UpsertBundleProductPayload = {
      code: value.code.trim(),
      name: value.name.trim(),
      outputUnit: value.outputUnit,
      sellingPrice: value.sellingPrice,
      isActive: value.isActive,
      bomLines: value.bomLines.map((l) => ({ itemId: l.itemId!, qtyPerUnit: l.qtyPerUnit! })),
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
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${bundle.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.bundleProductsService.remove(bundle.id).subscribe({
          next: () => {
            this.snackBar.open('Recipe deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message ?? 'Could not delete this recipe.', 'Dismiss', { duration: 5000 });
          },
        });
      });
  }
}
