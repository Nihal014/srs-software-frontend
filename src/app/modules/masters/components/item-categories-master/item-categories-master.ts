import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemCategoriesService } from 'app/shared/services/item-categories.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import type { ItemCategory, UpsertItemCategoryPayload } from 'app/shared/models/item-category.model';

@Component({
  selector: 'app-item-categories-master',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './item-categories-master.html',
})
export class ItemCategoriesMaster implements OnInit {
  private confirmService = inject(ConfirmService);
  private categoriesService = inject(ItemCategoriesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly columns = ['slno', 'code', 'name', 'items', 'status', 'edit', 'delete'];
  readonly categories = signal<ItemCategory[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<ItemCategory | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    code: ['', [Validators.maxLength(10), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
    isActive: true,
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.categoriesService.listAll().subscribe((categories) => {
      this.categories.set(categories);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ name: '', code: '', isActive: true });
  }

  startEdit(category: ItemCategory) {
    this.editing.set(category);
    this.form.reset({ name: category.name, code: category.code ?? '', isActive: !!category.is_active });
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
    const { name, code, isActive } = this.form.getRawValue();
    const payload: UpsertItemCategoryPayload = { name: name.trim(), code: code.trim() || undefined, isActive };

    this.saving.set(true);
    const request = editing === 'new' ? this.categoriesService.create(payload) : this.categoriesService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Category saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this category.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(category: ItemCategory) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${category.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.categoriesService.remove(category.id).subscribe({
          next: () => {
            this.snackBar.open('Category deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message ?? 'Could not delete this category.', 'Dismiss', { duration: 5000 });
          },
        });
      });
  }
}
