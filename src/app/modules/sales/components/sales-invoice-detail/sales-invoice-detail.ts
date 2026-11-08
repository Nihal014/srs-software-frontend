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
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { Account } from 'app/shared/models/accounts.model';
import { paymentStatusChip, paymentStatusLabel } from 'app/shared/models/purchase-invoice.model';
import type { SalesInvoiceDetail } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-invoice-detail',
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
  templateUrl: './sales-invoice-detail.html',
})
export class SalesInvoiceDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private salesDocs = inject(SalesDocsService);
  private accountsService = inject(AccountsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly statusText = paymentStatusLabel;
  readonly statusChip = paymentStatusChip;
  readonly lineColumns = ['slno', 'product', 'qty', 'returned', 'rate', 'tax', 'discount', 'amount'];
  readonly paymentColumns = ['slno', 'date', 'amount', 'account', 'reference', 'remove'];

  readonly detail = signal<SalesInvoiceDetail | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly paymentForm = this.fb.group({
    paymentDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    amount: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    accountId: this.fb.control<number | null>(null, Validators.required),
    reference: this.fb.nonNullable.control(''),
    remarks: this.fb.nonNullable.control(''),
  });

  ngOnInit() {
    this.accountsService.accounts().subscribe((accounts) => {
      const active = accounts.filter((a) => a.is_active);
      this.accounts.set(active);
      if (active.length && !this.paymentForm.controls.accountId.value) this.paymentForm.controls.accountId.setValue(active[0].id);
    });
    this.salesDocs.invoice(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (d) => this.apply(d),
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this invoice.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private apply(detail: SalesInvoiceDetail) {
    this.detail.set(detail);
    const due = Math.max(detail.outstanding, 0);
    this.paymentForm.controls.amount.setValue(due);
    this.paymentForm.controls.amount.setValidators([Validators.required, Validators.min(0.01), Validators.max(due || 0.01)]);
    this.paymentForm.controls.amount.updateValueAndValidity();
    this.loading.set(false);
  }

  recordPayment(detail: SalesInvoiceDetail) {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields before recording.', 'Dismiss', { duration: 3000 });
      return;
    }
    const v = this.paymentForm.getRawValue();
    const account = this.accounts().find((a) => a.id === v.accountId)?.name ?? '';
    this.confirmService
      .ask({
        title: 'Record payment',
        message: `Record Rs ${v.amount.toFixed(2)} received from ${detail.customer_name} into ${account}? It is also entered as a customer payment in Receipts.`,
        confirmLabel: 'Record payment',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs
          .recordInvoicePayment(detail.id, {
            paymentDate: v.paymentDate,
            amount: v.amount,
            accountId: v.accountId!,
            reference: v.reference.trim() || undefined,
            remarks: v.remarks.trim() || undefined,
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

  deletePayment(detail: SalesInvoiceDetail, payment: SalesInvoiceDetail['payments'][number]) {
    this.confirmService
      .ask({
        title: 'Delete payment',
        message: `Delete the Rs ${payment.amount.toFixed(2)} payment received on ${payment.payment_date}? The receipt in Accounts is removed too.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.salesDocs.deleteInvoicePayment(detail.id, payment.id).subscribe({
          next: (updated) => {
            this.apply(updated);
            this.snackBar.open('Payment deleted.', 'Dismiss', { duration: 2500 });
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this payment.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  deleteInvoice(detail: SalesInvoiceDetail) {
    this.confirmService
      .ask({
        title: 'Delete invoice',
        message: `Delete ${detail.invoice_number}? Its entry in the Sales Register is removed too. This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.salesDocs.removeInvoice(detail.id).subscribe({
          next: () => {
            this.snackBar.open('Invoice deleted.', 'Dismiss', { duration: 2500 });
            this.router.navigate(['/sales/invoices']);
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this invoice.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
