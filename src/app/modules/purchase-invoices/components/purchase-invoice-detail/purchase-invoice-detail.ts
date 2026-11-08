import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { PurchaseInvoicesService } from 'app/shared/services/purchase-invoices.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { Account, ExpenseCategory } from 'app/shared/models/accounts.model';
import {
  PAYMENT_STATUS,
  paymentStatusChip,
  paymentStatusLabel,
  type PurchaseInvoiceDetail,
  type PurchaseInvoicePayment,
} from 'app/shared/models/purchase-invoice.model';

@Component({
  selector: 'app-purchase-invoice-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './purchase-invoice-detail.html',
})
export class PurchaseInvoiceDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private invoicesService = inject(PurchaseInvoicesService);
  private accountsService = inject(AccountsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly PAID = PAYMENT_STATUS.Paid;
  readonly statusText = paymentStatusLabel;
  readonly statusChip = paymentStatusChip;
  readonly paymentColumns = ['slno', 'date', 'amount', 'account', 'category', 'reference', 'remove'];

  readonly detail = signal<PurchaseInvoiceDetail | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly paymentForm = this.fb.group({
    paymentDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    amount: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    accountId: this.fb.control<number | null>(null, Validators.required),
    categoryId: this.fb.control<number | null>(null, Validators.required),
    reference: this.fb.nonNullable.control(''),
    remarks: this.fb.nonNullable.control(''),
  });

  ngOnInit() {
    this.accountsService.accounts().subscribe((accounts) => this.accounts.set(accounts.filter((a) => a.is_active)));
    this.accountsService.categories().subscribe((categories) => {
      const active = categories.filter((c) => c.is_active);
      this.categories.set(active);
      const rawMaterials = active.find((c) => c.name === 'Raw materials');
      if (rawMaterials) this.paymentForm.controls.categoryId.setValue(rawMaterials.id);
    });
    this.invoicesService.get(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (detail) => this.apply(detail),
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this invoice.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private apply(detail: PurchaseInvoiceDetail) {
    this.detail.set(detail);
    this.paymentForm.controls.amount.setValue(detail.outstanding);
    this.paymentForm.controls.amount.setValidators([Validators.required, Validators.min(0.01), Validators.max(detail.outstanding)]);
    this.paymentForm.controls.amount.updateValueAndValidity();
    this.loading.set(false);
  }

  get grnDifference() {
    const d = this.detail();
    return d ? Math.round((d.amount - d.grn_value) * 100) / 100 : 0;
  }

  recordPayment(detail: PurchaseInvoiceDetail) {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields before recording.', 'Dismiss', { duration: 3000 });
      return;
    }
    const { paymentDate, amount, accountId, categoryId, reference, remarks } = this.paymentForm.getRawValue();
    const account = this.accounts().find((a) => a.id === accountId)?.name ?? '';
    this.confirmService
      .ask({
        title: 'Record payment',
        message: `Record a payment of Rs ${amount.toFixed(2)} to ${detail.supplier_name} from ${account}? It is also entered as an expense in Accounts.`,
        confirmLabel: 'Record payment',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.invoicesService
          .recordPayment(detail.id, {
            paymentDate,
            amount,
            accountId: accountId!,
            categoryId: categoryId!,
            reference: reference.trim() || undefined,
            remarks: remarks.trim() || undefined,
          })
          .subscribe({
            next: (updated) => {
              this.saving.set(false);
              this.paymentForm.controls.reference.setValue('');
              this.paymentForm.controls.remarks.setValue('');
              this.apply(updated);
              this.snackBar.open('Payment recorded.', 'Dismiss', { duration: 2500 });
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this payment.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }

  deletePayment(detail: PurchaseInvoiceDetail, payment: PurchaseInvoicePayment) {
    this.confirmService
      .ask({
        title: 'Delete payment',
        message: `Delete the Rs ${payment.amount.toFixed(2)} payment made on ${payment.payment_date}? The matching expense in Accounts is removed too.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.invoicesService.deletePayment(detail.id, payment.id).subscribe({
          next: (updated) => {
            this.apply(updated);
            this.snackBar.open('Payment deleted.', 'Dismiss', { duration: 2500 });
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this payment.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  deleteInvoice(detail: PurchaseInvoiceDetail) {
    this.confirmService
      .ask({
        title: 'Delete invoice',
        message: `Delete invoice ${detail.supplier_invoice_no} from ${detail.supplier_name}? This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.invoicesService.remove(detail.id).subscribe({
          next: () => {
            this.snackBar.open('Invoice deleted.', 'Dismiss', { duration: 2500 });
            this.router.navigate(['/purchase-invoices']);
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this invoice.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
