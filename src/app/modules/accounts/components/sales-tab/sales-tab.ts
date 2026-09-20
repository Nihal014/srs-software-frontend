import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { Sale, SalePayload } from 'app/shared/models/accounts.model';

@Component({
  selector: 'app-sales-tab',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, DateField],
  templateUrl: './sales-tab.html',
})
export class SalesTab implements OnInit {
  private api = inject(AccountsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly columns = ['date', 'customer', 'description', 'amount', 'edit', 'delete'];
  readonly rows = signal<Sale[]>([]);
  readonly total = signal(0);
  readonly sum = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly loading = signal(true);
  readonly editing = signal<Sale | 'new' | null>(null);
  readonly saving = signal(false);

  readonly filter = this.fb.nonNullable.group({ from: '', to: '', search: '' });

  readonly form = this.fb.nonNullable.group({
    saleDate: [toDateString(new Date()), Validators.required],
    customer: '',
    description: ['', [Validators.required, Validators.minLength(2)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    remarks: '',
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api
      .sales({ ...f, from: f.from || undefined, to: f.to || undefined, page: this.page(), pageSize: this.pageSize() })
      .subscribe((res) => {
        this.rows.set(res.rows);
        this.total.set(res.total);
        this.sum.set(res.sum);
        this.loading.set(false);
      });
  }

  applyFilter() {
    this.page.set(1);
    this.load();
  }

  clearFilter() {
    this.filter.reset();
    this.applyFilter();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ saleDate: toDateString(new Date()), customer: '', description: '', amount: 0, remarks: '' });
  }

  startEdit(row: Sale) {
    this.editing.set(row);
    this.form.reset({
      saleDate: row.sale_date,
      customer: row.customer ?? '',
      description: row.description,
      amount: row.amount,
      remarks: row.remarks ?? '',
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
    const v = this.form.getRawValue();
    const payload: SalePayload = {
      saleDate: v.saleDate,
      customer: v.customer.trim() || undefined,
      description: v.description.trim(),
      amount: v.amount,
      remarks: v.remarks.trim() || undefined,
    };
    const editing = this.editing();
    this.saving.set(true);
    this.api.saveSale(editing === 'new' ? null : editing!.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Sale saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this sale.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(row: Sale) {
    if (!confirm(`Delete this sale (${row.description}, Rs ${row.amount})? This can't be undone.`)) return;
    this.api.removeSale(row.id).subscribe({
      next: () => {
        this.snackBar.open('Sale deleted.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete.', 'Dismiss', { duration: 4000 }),
    });
  }
}
