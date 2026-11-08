import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { GrnService } from 'app/modules/grn/grn.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { PurchaseInvoicesService } from 'app/shared/services/purchase-invoices.service';
import { parseDateString, toDateString } from 'app/shared/utils/date.util';
import type { GrnListRow } from 'app/shared/models/grn.model';
import type { NewInvoiceContext } from 'app/shared/models/purchase-invoice.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Component({
  selector: 'app-purchase-invoice-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './purchase-invoice-form.html',
})
export class PurchaseInvoiceForm implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private grnService = inject(GrnService);
  private invoicesService = inject(PurchaseInvoicesService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly lineColumns = ['slno', 'item', 'qty', 'rate', 'tax', 'value'];
  readonly grns = signal<GrnListRow[]>([]);
  readonly context = signal<NewInvoiceContext | null>(null);
  readonly loadingContext = signal(false);
  readonly saving = signal(false);

  // Once the due date is edited by hand it stops following the invoice date.
  private dueEdited = false;

  readonly form = this.fb.group({
    grnId: this.fb.control<number | null>(null, Validators.required),
    supplierInvoiceNo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
    invoiceDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    dueDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    amount: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    remarks: this.fb.nonNullable.control(''),
  });

  ngOnInit() {
    this.grnService.list().subscribe((grns) => this.grns.set(grns));
    this.form.controls.grnId.valueChanges.subscribe((id) => this.loadContext(id));
    this.form.controls.invoiceDate.valueChanges.subscribe(() => this.followTerms());
    this.form.controls.dueDate.valueChanges.subscribe((due) => {
      if (due !== this.suggestedDue()) this.dueEdited = true;
    });
  }

  private suggestedDue(): string {
    const ctx = this.context();
    const invoice = parseDateString(this.form.controls.invoiceDate.value);
    if (!ctx || !invoice) return this.form.controls.dueDate.value;
    invoice.setDate(invoice.getDate() + ctx.termsDays);
    return toDateString(invoice);
  }

  private followTerms() {
    if (this.dueEdited || !this.context()) return;
    this.form.controls.dueDate.setValue(this.suggestedDue(), { emitEvent: false });
  }

  private loadContext(grnId: number | null) {
    this.context.set(null);
    if (!grnId) return;
    this.loadingContext.set(true);
    this.invoicesService.newContext(grnId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        this.dueEdited = false;
        const remaining = round2(ctx.grnValue - ctx.alreadyInvoiced);
        this.form.controls.amount.setValue(remaining > 0 ? remaining : ctx.grnValue);
        this.followTerms();
        this.loadingContext.set(false);
      },
      error: (err) => {
        this.loadingContext.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this GRN.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  /** Invoice amount minus the GRN value, so a billing difference is obvious before saving. */
  get difference() {
    const ctx = this.context();
    return ctx ? round2(this.form.controls.amount.value - ctx.grnValue) : 0;
  }

  save() {
    const ctx = this.context();
    if (!ctx) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields before saving.', 'Dismiss', { duration: 3000 });
      return;
    }
    const { grnId, supplierInvoiceNo, invoiceDate, dueDate, amount, remarks } = this.form.getRawValue();
    const gap = this.difference !== 0 ? ` It differs from the GRN value (Rs ${ctx.grnValue.toFixed(2)}) by Rs ${Math.abs(this.difference).toFixed(2)}.` : '';
    this.confirmService
      .ask({
        title: 'Record purchase invoice',
        message: `Record invoice ${supplierInvoiceNo.trim()} from ${ctx.grn.supplier_name} for Rs ${amount.toFixed(2)}?${gap}`,
        confirmLabel: 'Record invoice',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.invoicesService
          .create({ grnId: grnId!, supplierInvoiceNo: supplierInvoiceNo.trim(), invoiceDate, dueDate, amount, remarks: remarks.trim() || undefined })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.invoice_number} recorded.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/purchase-invoices', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this invoice.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
