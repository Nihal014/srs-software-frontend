import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import type { SalesLocation, UpsertSalesLocationPayload } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-locations-master',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './sales-locations-master.html',
})
export class SalesLocationsMaster implements OnInit {
  private confirmService = inject(ConfirmService);
  private salesDocs = inject(SalesDocsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly columns = ['slno', 'name', 'address', 'status', 'edit', 'delete'];
  readonly locations = signal<SalesLocation[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<SalesLocation | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    address: '',
    isActive: true,
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.salesDocs.locationsAll().subscribe((locations) => {
      this.locations.set(locations);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ name: '', address: '', isActive: true });
  }

  startEdit(location: SalesLocation) {
    this.editing.set(location);
    this.form.reset({ name: location.name, address: location.address ?? '', isActive: !!location.is_active });
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
    const v = this.form.getRawValue();
    const payload: UpsertSalesLocationPayload = { name: v.name.trim(), address: v.address.trim() || undefined, isActive: v.isActive };
    this.saving.set(true);
    const request = editing === 'new' ? this.salesDocs.createLocation(payload) : this.salesDocs.updateLocation(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Sales location saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this location.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(location: SalesLocation) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${location.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.salesDocs.removeLocation(location.id).subscribe({
          next: () => {
            this.snackBar.open('Sales location deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this location.', 'Dismiss', { duration: 5000 }),
        });
      });
  }
}
