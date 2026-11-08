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
import { ConfirmService } from 'app/shared/services/confirm.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { toDateString } from 'app/shared/utils/date.util';
import {
  SALES_RETURN_REASON,
  SALES_RETURN_REASON_LABEL,
  type SalesInvoiceListRow,
  type SalesReturnContext,
  type SalesReturnReason,
} from 'app/shared/models/sales-docs.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

type ContextLine = SalesReturnContext['lines'][number];

function createLine(fb: FormBuilder, l: ContextLine) {
  return fb.nonNullable.group({
    invoiceLineId: l.invoice_line_id,
    productName: l.product_name,
    unit: l.unit,
    invoiced: l.qty,
    returned: l.qty_returned,
    returnable: l.returnable,
    unitAmount: l.unit_amount,
    qty: [0, [Validators.required, Validators.min(0), Validators.max(l.returnable)]],
    reason: fb.nonNullable.control<SalesReturnReason>(SALES_RETURN_REASON.Damaged, Validators.required),
  });
}

type ReturnLineGroup = ReturnType<typeof createLine>;

@Component({
  selector: 'app-sales-return-form',
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
  templateUrl: './sales-return-form.html',
  styleUrl: './sales-return-form.scss',
})
export class SalesReturnForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private salesDocs = inject(SalesDocsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly reasons = Object.values(SALES_RETURN_REASON).map((value) => ({ value, label: SALES_RETURN_REASON_LABEL[value] }));
  readonly lineColumns = ['slno', 'product', 'invoiced', 'returned', 'returnable', 'qty', 'reason', 'amount'];
  readonly invoices = signal<SalesInvoiceListRow[]>([]);
  readonly context = signal<SalesReturnContext | null>(null);
  readonly loadingContext = signal(false);
  readonly saving = signal(false);
  readonly lineGroups = signal<ReturnLineGroup[]>([]);

  readonly form = this.fb.group({
    invoiceId: this.fb.control<number | null>(null, Validators.required),
    returnDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<ReturnLineGroup>([]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.salesDocs.invoices(1, 200, null, null).subscribe((res) => {
      this.invoices.set(res.rows);
      const preset = Number(this.route.snapshot.queryParamMap.get('invoiceId'));
      if (preset) this.form.controls.invoiceId.setValue(preset);
    });
    this.form.controls.invoiceId.valueChanges.subscribe((id) => this.loadContext(id));
  }

  private loadContext(invoiceId: number | null) {
    this.context.set(null);
    this.lines.clear();
    this.lineGroups.set([]);
    if (!invoiceId) return;
    this.loadingContext.set(true);
    this.salesDocs.returnContext(invoiceId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        ctx.lines.forEach((l) => this.lines.push(createLine(this.fb, l)));
        this.lineGroups.set([...this.lines.controls]);
        this.loadingContext.set(false);
      },
      error: (err) => {
        this.loadingContext.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this invoice.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  /** The credit shown here is an estimate; the server works out the exact figure when it is posted. */
  amountOf(line: ReturnLineGroup) {
    const { qty, unitAmount } = line.getRawValue();
    return round2((qty || 0) * unitAmount);
  }

  get totals() {
    const returning = this.lines.getRawValue().filter((l) => l.qty > 0);
    return { lines: returning.length, amount: round2(returning.reduce((a, l) => a + (l.qty || 0) * l.unitAmount, 0)) };
  }

  qtyError(line: ReturnLineGroup): string | null {
    const qty = line.controls.qty;
    if (!qty.touched) return null;
    if (qty.hasError('max')) return `only ${line.controls.returnable.value} can still come back`;
    if (qty.invalid) return 'enter 0 or more';
    return null;
  }

  save() {
    const ctx = this.context();
    if (!ctx) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted lines before saving.', 'Dismiss', { duration: 3000 });
      return;
    }
    const v = this.form.getRawValue();
    const returning = v.lines.filter((l) => l.qty > 0);
    if (!returning.length) {
      this.snackBar.open('Enter a return quantity on at least one line.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.confirmService
      .ask({
        title: 'Record sales return',
        message: `Credit about Rs ${this.totals.amount.toFixed(2)} to ${ctx.invoice.customer_name} on ${ctx.invoice.invoice_number}? It also reduces the Sales Register, and it can't be undone.`,
        confirmLabel: 'Record return',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs
          .createReturn({
            invoiceId: ctx.invoice.id,
            returnDate: v.returnDate,
            remarks: v.remarks.trim() || undefined,
            lines: returning.map((l) => ({ invoiceLineId: l.invoiceLineId, qty: l.qty, reason: l.reason })),
          })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.return_number} recorded.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/sales/returns', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this return.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
