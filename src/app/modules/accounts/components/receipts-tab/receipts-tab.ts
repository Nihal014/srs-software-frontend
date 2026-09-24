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
  RECEIPT_SOURCE,
  RECEIPT_SOURCE_LABEL,
  type Account,
  type Receipt,
  type ReceiptPayload,
  type ReceiptSource,
} from 'app/shared/models/accounts.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

@Component({
  selector: 'app-receipts-tab',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule, DateField],
  templateUrl: './receipts-tab.html',
})
export class ReceiptsTab implements OnInit {
  private confirmService = inject(ConfirmService);
  private api = inject(AccountsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly sources = Object.values(RECEIPT_SOURCE).map((value) => ({ value, label: RECEIPT_SOURCE_LABEL[value] }));
  readonly columns = ['slno', 'date', 'source', 'description', 'amount', 'account', 'edit', 'delete'];
  readonly rows = signal<Receipt[]>([]);
  readonly total = signal(0);
  readonly sum = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly loading = signal(true);
  readonly accounts = signal<Account[]>([]);
  readonly editing = signal<Receipt | 'new' | null>(null);
  readonly saving = signal(false);

  readonly filter = this.fb.nonNullable.group({
    from: '',
    to: '',
    search: '',
    accountId: this.fb.control<number | null>(null),
  });

  readonly form = this.fb.nonNullable.group({
    receiptDate: [toDateString(new Date()), Validators.required],
    source: this.fb.nonNullable.control<ReceiptSource>(RECEIPT_SOURCE.SalesPayment, Validators.required),
    description: ['', [Validators.required, Validators.minLength(2)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    accountId: this.fb.control<number | null>(null, Validators.required),
    remarks: '',
  });

  sourceText(source: ReceiptSource): string {
    return RECEIPT_SOURCE_LABEL[source];
  }

  ngOnInit() {
    this.api.accounts().subscribe((a) => this.accounts.set(a));
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api
      .receipts({ ...f, from: f.from || undefined, to: f.to || undefined, page: this.page(), pageSize: this.pageSize() })
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

  activeAccounts() {
    const editing = this.editing();
    return this.accounts().filter((a) => a.is_active || (editing && editing !== 'new' && editing.account_id === a.id));
  }

  startCreate() {
    this.editing.set('new');
    const first = this.accounts().find((a) => a.is_active);
    this.form.reset({
      receiptDate: toDateString(new Date()),
      source: RECEIPT_SOURCE.SalesPayment,
      description: '',
      amount: 0,
      accountId: first?.id ?? null,
      remarks: '',
    });
  }

  startEdit(row: Receipt) {
    this.editing.set(row);
    this.form.reset({
      receiptDate: row.receipt_date,
      source: row.source,
      description: row.description,
      amount: row.amount,
      accountId: row.account_id,
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
    const payload: ReceiptPayload = {
      receiptDate: v.receiptDate,
      source: v.source,
      description: v.description.trim(),
      amount: v.amount,
      accountId: v.accountId!,
      remarks: v.remarks.trim() || undefined,
    };
    const editing = this.editing();
    this.saving.set(true);
    this.api.saveReceipt(editing === 'new' ? null : editing!.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Receipt saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this receipt.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(row: Receipt) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete this receipt (${row.description}, Rs ${row.amount})? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api.removeReceipt(row.id).subscribe({
          next: () => {
            this.snackBar.open('Receipt deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
