import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import { toDateString } from 'app/shared/utils/date.util';
import {
  BILL_STATUS,
  BILL_STATUS_LABEL,
  type Account,
  type BillStatus,
  type Expense,
  type ExpenseCategory,
  type ExpensePayload,
} from 'app/shared/models/accounts.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

@Component({
  selector: 'app-expenses-tab',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule, DateField],
  templateUrl: './expenses-tab.html',
})
export class ExpensesTab implements OnInit {
  private confirmService = inject(ConfirmService);
  private api = inject(AccountsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly billStatuses = Object.values(BILL_STATUS).map((value) => ({ value, label: BILL_STATUS_LABEL[value] }));
  readonly columns = ['slno', 'date', 'description', 'category', 'qty', 'amount', 'account', 'bill', 'edit', 'delete'];
  readonly rows = signal<Expense[]>([]);
  readonly total = signal(0);
  readonly sum = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly loading = signal(true);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly editing = signal<Expense | 'new' | null>(null);
  readonly saving = signal(false);

  readonly filter = this.fb.nonNullable.group({
    from: '',
    to: '',
    search: '',
    categoryId: this.fb.control<number | null>(null),
    accountId: this.fb.control<number | null>(null),
  });

  readonly form = this.fb.nonNullable.group({
    expenseDate: [toDateString(new Date()), Validators.required],
    description: ['', [Validators.required, Validators.minLength(2)]],
    categoryId: this.fb.control<number | null>(null, Validators.required),
    qty: [1, [Validators.required, Validators.min(0.001)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    accountId: this.fb.control<number | null>(null, Validators.required),
    billStatus: this.fb.nonNullable.control<BillStatus>(BILL_STATUS.Available),
    remarks: '',
  });

  billText(status: BillStatus): string {
    return BILL_STATUS_LABEL[status];
  }

  ngOnInit() {
    this.api.categories().subscribe((c) => this.categories.set(c));
    this.api.accounts().subscribe((a) => this.accounts.set(a));
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api
      .expenses({ ...f, from: f.from || undefined, to: f.to || undefined, page: this.page(), pageSize: this.pageSize() })
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

  /** Inactive categories/accounts are hidden from new entries, but stay selectable on the row being edited. */
  activeCategories() {
    const editing = this.editing();
    return this.categories().filter((c) => c.is_active || (editing && editing !== 'new' && editing.category_id === c.id));
  }

  activeAccounts() {
    const editing = this.editing();
    return this.accounts().filter((a) => a.is_active || (editing && editing !== 'new' && editing.account_id === a.id));
  }

  startCreate() {
    this.editing.set('new');
    const first = this.accounts().find((a) => a.is_active);
    this.form.reset({
      expenseDate: toDateString(new Date()),
      description: '',
      categoryId: null,
      qty: 1,
      amount: 0,
      accountId: first?.id ?? null,
      billStatus: BILL_STATUS.Available,
      remarks: '',
    });
  }

  startEdit(row: Expense) {
    this.editing.set(row);
    this.form.reset({
      expenseDate: row.expense_date,
      description: row.description,
      categoryId: row.category_id,
      qty: row.qty,
      amount: row.amount,
      accountId: row.account_id,
      billStatus: row.bill_status,
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
    const payload: ExpensePayload = {
      expenseDate: v.expenseDate,
      description: v.description.trim(),
      categoryId: v.categoryId!,
      qty: v.qty,
      amount: v.amount,
      accountId: v.accountId!,
      billStatus: v.billStatus,
      remarks: v.remarks.trim() || undefined,
    };
    const editing = this.editing();
    this.saving.set(true);
    this.api.saveExpense(editing === 'new' ? null : editing!.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Expense saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this expense.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(row: Expense) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete this expense (${row.description}, Rs ${row.amount})? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api.removeExpense(row.id).subscribe({
          next: () => {
            this.snackBar.open('Expense deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
