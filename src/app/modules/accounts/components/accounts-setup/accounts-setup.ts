import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import { toDateString } from 'app/shared/utils/date.util';
import {
  ACCOUNT_TYPE,
  ACCOUNT_TYPE_LABEL,
  PL_GROUP,
  PL_GROUP_LABEL,
  type Account,
  type AccountType,
  type ExpenseCategory,
  type PlGroup,
  type ReadyProducts,
} from 'app/shared/models/accounts.model';

@Component({
  selector: 'app-accounts-setup',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, DateField],
  templateUrl: './accounts-setup.html',
})
export class AccountsSetup implements OnInit {
  private api = inject(AccountsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly plGroups = Object.values(PL_GROUP).map((value) => ({ value, label: PL_GROUP_LABEL[value] }));
  readonly accountTypes = Object.values(ACCOUNT_TYPE).map((value) => ({ value, label: ACCOUNT_TYPE_LABEL[value] }));
  readonly categoryColumns = ['name', 'group', 'status', 'edit', 'delete'];
  readonly accountColumns = ['name', 'type', 'opening', 'balance', 'status', 'edit', 'delete'];
  readonly readyColumns = ['date', 'amount', 'remarks', 'delete'];

  readonly categories = signal<ExpenseCategory[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly ready = signal<ReadyProducts[]>([]);
  readonly editingCategory = signal<ExpenseCategory | 'new' | null>(null);
  readonly editingAccount = signal<Account | 'new' | null>(null);
  readonly addingReady = signal(false);
  readonly saving = signal(false);

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    plGroup: this.fb.nonNullable.control<PlGroup>(PL_GROUP.OtherExpense, Validators.required),
    isActive: true,
  });

  readonly accountForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    accountType: this.fb.nonNullable.control<AccountType>(ACCOUNT_TYPE.Bank, Validators.required),
    openingBalance: [0, Validators.required],
    isActive: true,
  });

  readonly readyForm = this.fb.nonNullable.group({
    asOfDate: [toDateString(new Date()), Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    remarks: '',
  });

  groupText(group: PlGroup): string {
    return PL_GROUP_LABEL[group];
  }

  typeText(type: AccountType): string {
    return ACCOUNT_TYPE_LABEL[type];
  }

  ngOnInit() {
    this.loadCategories();
    this.loadAccounts();
    this.loadReady();
  }

  loadCategories() {
    this.api.categories().subscribe((c) => this.categories.set(c));
  }

  loadAccounts() {
    this.api.accounts().subscribe((a) => this.accounts.set(a));
  }

  loadReady() {
    this.api.readyProducts().subscribe((r) => this.ready.set(r));
  }

  private fail(err: { error?: { message?: string } }, fallback: string) {
    this.saving.set(false);
    this.snackBar.open(err.error?.message ?? fallback, 'Dismiss', { duration: 5000 });
  }

  // categories
  startCategory(category?: ExpenseCategory) {
    this.editingCategory.set(category ?? 'new');
    this.categoryForm.reset({
      name: category?.name ?? '',
      plGroup: category?.pl_group ?? PL_GROUP.OtherExpense,
      isActive: category ? !!category.is_active : true,
    });
  }

  saveCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    const v = this.categoryForm.getRawValue();
    const editing = this.editingCategory();
    this.saving.set(true);
    this.api.saveCategory(editing === 'new' ? null : editing!.id, { name: v.name.trim(), plGroup: v.plGroup, isActive: v.isActive }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Category saved.', 'Dismiss', { duration: 2500 });
        this.editingCategory.set(null);
        this.loadCategories();
      },
      error: (err) => this.fail(err, 'Could not save this category.'),
    });
  }

  removeCategory(category: ExpenseCategory) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    this.api.removeCategory(category.id).subscribe({
      next: () => {
        this.snackBar.open('Category deleted.', 'Dismiss', { duration: 2500 });
        this.loadCategories();
      },
      error: (err) => this.fail(err, 'Could not delete this category.'),
    });
  }

  // accounts
  startAccount(account?: Account) {
    this.editingAccount.set(account ?? 'new');
    this.accountForm.reset({
      name: account?.name ?? '',
      accountType: account?.account_type ?? ACCOUNT_TYPE.Bank,
      openingBalance: account?.opening_balance ?? 0,
      isActive: account ? !!account.is_active : true,
    });
  }

  saveAccount() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    const v = this.accountForm.getRawValue();
    const editing = this.editingAccount();
    this.saving.set(true);
    this.api
      .saveAccount(editing === 'new' ? null : editing!.id, { name: v.name.trim(), accountType: v.accountType, openingBalance: v.openingBalance, isActive: v.isActive })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Account saved.', 'Dismiss', { duration: 2500 });
          this.editingAccount.set(null);
          this.loadAccounts();
        },
        error: (err) => this.fail(err, 'Could not save this account.'),
      });
  }

  removeAccount(account: Account) {
    if (!confirm(`Delete account "${account.name}"?`)) return;
    this.api.removeAccount(account.id).subscribe({
      next: () => {
        this.snackBar.open('Account deleted.', 'Dismiss', { duration: 2500 });
        this.loadAccounts();
      },
      error: (err) => this.fail(err, 'Could not delete this account.'),
    });
  }

  // ready products
  startReady() {
    this.addingReady.set(true);
    this.readyForm.reset({ asOfDate: toDateString(new Date()), amount: 0, remarks: '' });
  }

  saveReady() {
    if (this.readyForm.invalid) {
      this.readyForm.markAllAsTouched();
      return;
    }
    const v = this.readyForm.getRawValue();
    this.saving.set(true);
    this.api.addReadyProducts({ asOfDate: v.asOfDate, amount: v.amount, remarks: v.remarks.trim() || undefined }).subscribe({
      next: (list) => {
        this.saving.set(false);
        this.snackBar.open('Ready-products value recorded.', 'Dismiss', { duration: 2500 });
        this.addingReady.set(false);
        this.ready.set(list);
      },
      error: (err) => this.fail(err, 'Could not save this value.'),
    });
  }

  removeReady(row: ReadyProducts) {
    if (!confirm(`Delete the ${row.as_of_date} entry?`)) return;
    this.api.removeReadyProducts(row.id).subscribe({
      next: (list) => this.ready.set(list),
      error: (err) => this.fail(err, 'Could not delete this entry.'),
    });
  }
}
