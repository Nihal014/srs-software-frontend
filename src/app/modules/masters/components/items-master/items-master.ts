import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { ItemsService } from 'app/shared/services/items.service';
import { ItemCategoriesService } from 'app/shared/services/item-categories.service';
import type { ItemCategory } from 'app/shared/models/item-category.model';
import type { Item, UpsertItemPayload } from 'app/shared/models/item.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

const UNITS = ['kg', 'pcs', 'g', 'l', 'ml'];

@Component({
  selector: 'app-items-master',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule],
  templateUrl: './items-master.html',
})
export class ItemsMaster implements OnInit {
  private confirmService = inject(ConfirmService);
  private itemsService = inject(ItemsService);
  private categoriesService = inject(ItemCategoriesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly units = UNITS;
  readonly columns = ['slno', 'code', 'name', 'category', 'unit', 'rate', 'reorder_level', 'status', 'edit', 'delete'];
  readonly items = signal<Item[]>([]);
  readonly categories = signal<ItemCategory[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Item | 'new' | null>(null);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    unit: [UNITS[0], [Validators.required]],
    categoryId: this.fb.control<number | null>(null),
    rate: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [0, [Validators.required, Validators.min(0)]],
    isActive: true,
  });

  ngOnInit() {
    this.loadCategories();
    this.load();
  }

  /** The Item Code Creation tabs stay alive side by side, so re-read the categories whenever the form opens. */
  private loadCategories() {
    this.categoriesService.listAll().subscribe((categories) => this.categories.set(categories));
  }

  /** Active categories for the picker, plus the item's own category even when it has since been deactivated. */
  pickableCategories(): ItemCategory[] {
    const editing = this.editing();
    const current = editing && editing !== 'new' ? editing.category_id : null;
    return this.categories().filter((c) => c.is_active || c.id === current);
  }

  load() {
    this.loading.set(true);
    this.itemsService.listPaged(this.page(), this.pageSize()).subscribe((res) => {
      this.items.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  startCreate() {
    this.loadCategories();
    this.editing.set('new');
    this.form.reset({ code: '', name: '', unit: UNITS[0], categoryId: null, rate: 0, reorderLevel: 0, isActive: true });
  }

  startEdit(item: Item) {
    this.loadCategories();
    this.editing.set(item);
    this.form.reset({
      code: item.code,
      name: item.name,
      unit: item.unit,
      categoryId: item.category_id,
      rate: item.rate,
      reorderLevel: item.reorder_level,
      isActive: !!item.is_active,
    });
  }

  cancel() {
    this.editing.set(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const editing = this.editing();
    const value = this.form.getRawValue();
    const payload: UpsertItemPayload = {
      code: value.code.trim(),
      name: value.name.trim(),
      unit: value.unit,
      categoryId: value.categoryId,
      reorderLevel: value.reorderLevel,
      isActive: value.isActive,
    };
    if (editing === 'new') payload.rate = value.rate;

    this.saving.set(true);
    const request = editing === 'new' ? this.itemsService.create(payload) : this.itemsService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Item saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this item.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(item: Item) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${item.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.itemsService.remove(item.id).subscribe({
          next: () => {
            this.snackBar.open('Item deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message ?? 'Could not delete this item.', 'Dismiss', { duration: 5000 });
          },
        });
      });
  }
}
