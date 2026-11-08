import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
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
import { PurchaseReturnsService } from 'app/shared/services/purchase-returns.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { GrnListRow } from 'app/shared/models/grn.model';
import {
  PURCHASE_RETURN_REASON,
  PURCHASE_RETURN_REASON_LABEL,
  type PurchaseReturnContext,
  type PurchaseReturnReason,
  type ReturnableBatch,
} from 'app/shared/models/purchase-return.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

function createLine(fb: FormBuilder, b: ReturnableBatch) {
  return fb.nonNullable.group({
    batchId: b.batch_id,
    itemName: b.item_name,
    categoryName: b.category_name ?? '',
    unit: b.unit,
    batchNumber: b.batch_number,
    expiryDate: b.expiry_date,
    available: b.qty_available,
    rate: b.rate,
    qty: [0, [Validators.required, Validators.min(0), Validators.max(b.qty_available)]],
    reason: fb.nonNullable.control<PurchaseReturnReason>(PURCHASE_RETURN_REASON.Damaged, Validators.required),
  });
}

type ReturnLineGroup = ReturnType<typeof createLine>;

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    DatePipe,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './purchase-return-form.html',
  styleUrl: './purchase-return-form.scss',
})
export class PurchaseReturnForm implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private grnService = inject(GrnService);
  private returnsService = inject(PurchaseReturnsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly reasons = Object.values(PURCHASE_RETURN_REASON).map((value) => ({ value, label: PURCHASE_RETURN_REASON_LABEL[value] }));
  readonly lineColumns = ['slno', 'item', 'category', 'batch', 'expiry', 'available', 'rate', 'qty', 'reason', 'amount'];

  readonly grns = signal<GrnListRow[]>([]);
  readonly context = signal<PurchaseReturnContext | null>(null);
  readonly loadingContext = signal(false);
  readonly saving = signal(false);
  // Mirrors the FormArray so mat-table re-renders when a different GRN is picked.
  readonly lineGroups = signal<ReturnLineGroup[]>([]);

  readonly form = this.fb.group({
    grnId: this.fb.control<number | null>(null, Validators.required),
    returnDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<ReturnLineGroup>([]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.grnService.list().subscribe((grns) => this.grns.set(grns));
    this.form.controls.grnId.valueChanges.subscribe((id) => this.loadContext(id));
  }

  private loadContext(grnId: number | null) {
    this.context.set(null);
    this.lines.clear();
    this.lineGroups.set([]);
    if (!grnId) return;
    this.loadingContext.set(true);
    this.returnsService.newContext(grnId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        ctx.batches.forEach((b) => this.lines.push(createLine(this.fb, b)));
        this.lineGroups.set([...this.lines.controls]);
        this.loadingContext.set(false);
      },
      error: (err) => {
        this.loadingContext.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this GRN.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  amountOf(line: ReturnLineGroup) {
    const { qty, rate } = line.getRawValue();
    return round2((qty || 0) * rate);
  }

  get totals() {
    const returning = this.lines.getRawValue().filter((l) => l.qty > 0);
    return { lines: returning.length, amount: round2(returning.reduce((a, l) => a + (l.qty || 0) * l.rate, 0)) };
  }

  qtyError(line: ReturnLineGroup): string | null {
    const qty = line.controls.qty;
    if (!qty.touched) return null;
    if (qty.hasError('max')) return `only ${line.controls.available.value} in stock`;
    if (qty.invalid) return 'enter 0 or more';
    return null;
  }

  post() {
    const ctx = this.context();
    const grnId = this.form.controls.grnId.value;
    if (!ctx || !grnId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted lines before posting.', 'Dismiss', { duration: 3000 });
      return;
    }
    const returning = this.lines.getRawValue().filter((l) => l.qty > 0);
    if (!returning.length) {
      this.snackBar.open('Enter a return quantity on at least one batch.', 'Dismiss', { duration: 3000 });
      return;
    }
    const { amount } = this.totals;
    this.confirmService
      .ask({
        title: 'Post purchase return',
        message: `Send these goods back to ${ctx.grn.supplier_name}? Stock will be reduced and Rs ${amount.toFixed(2)} recorded as credit due from the supplier. It can't be undone.`,
        confirmLabel: 'Post return',
      })
      .subscribe((confirmed) => {
        if (confirmed) this.submit(grnId, returning);
      });
  }

  private submit(grnId: number, returning: ReturnType<PurchaseReturnForm['lines']['getRawValue']>) {
    const { returnDate, remarks } = this.form.getRawValue();
    this.saving.set(true);
    this.returnsService
      .create({
        grnId,
        returnDate,
        remarks: remarks.trim() || undefined,
        lines: returning.map((l) => ({ batchId: l.batchId, qty: l.qty, reason: l.reason })),
      })
      .subscribe({
        next: (created) => {
          this.saving.set(false);
          this.snackBar.open(`${created.return_number} posted.`, 'Dismiss', { duration: 3000 });
          this.router.navigate(['/purchase-returns', created.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message ?? 'Could not post this return.', 'Dismiss', { duration: 5000 });
        },
      });
  }
}
