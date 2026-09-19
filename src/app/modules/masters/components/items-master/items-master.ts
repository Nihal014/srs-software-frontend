import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemsService } from 'app/shared/services/items.service';
import type { Item, UpsertItemPayload } from 'app/shared/models/item.model';

const UNITS = ['kg', 'pcs', 'g', 'l', 'ml'];

@Component({
  selector: 'app-items-master',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './items-master.html',
})
export class ItemsMaster implements OnInit {
  private itemsService = inject(ItemsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly units = UNITS;
  readonly columns = ['code', 'name', 'unit', 'rate', 'reorder_level', 'status', 'edit', 'delete'];
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Item | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    unit: [UNITS[0], [Validators.required]],
    rate: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [0, [Validators.required, Validators.min(0)]],
    isActive: true,
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.itemsService.listAll().subscribe((items) => {
      this.items.set(items);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ code: '', name: '', unit: UNITS[0], rate: 0, reorderLevel: 0, isActive: true });
  }

  startEdit(item: Item) {
    this.editing.set(item);
    this.form.reset({
      code: item.code,
      name: item.name,
      unit: item.unit,
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
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    this.itemsService.remove(item.id).subscribe({
      next: () => {
        this.snackBar.open('Item deleted.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Could not delete this item.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
