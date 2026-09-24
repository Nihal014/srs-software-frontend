import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BatchesService } from 'app/shared/services/batches.service';
import { BATCH_ADJUSTMENT_REASON, BATCH_ADJUSTMENT_REASON_LABEL, type Batch, type BatchAdjustmentReason } from 'app/shared/models/batch.model';

export interface BatchAdjustDialogData {
  batch: Batch;
  /** Pre-fills the form for the one-click "Write off" shortcut on an already-expired batch. */
  preset?: { direction: 'remove' | 'add'; qty: number; reason: BatchAdjustmentReason };
  title?: string;
}

@Component({
  selector: 'app-batch-adjust-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './batch-adjust-dialog.html',
})
export class BatchAdjustDialog {
  private readonly ref = inject(MatDialogRef<BatchAdjustDialog, boolean>);
  readonly data = inject<BatchAdjustDialogData>(MAT_DIALOG_DATA);
  private batchesService = inject(BatchesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly reasons = Object.values(BATCH_ADJUSTMENT_REASON).map((value) => ({ value, label: BATCH_ADJUSTMENT_REASON_LABEL[value] }));
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    direction: this.fb.nonNullable.control<'remove' | 'add'>(this.data.preset?.direction ?? 'remove'),
    qty: [
      this.data.preset?.qty ?? 0,
      [Validators.required, Validators.min(0.001)],
    ],
    reason: this.fb.nonNullable.control<BatchAdjustmentReason>(this.data.preset?.reason ?? BATCH_ADJUSTMENT_REASON.CountCorrection, Validators.required),
    remarks: '',
  });

  close() {
    this.ref.close(false);
  }

  get estimatedValue(): number {
    const qty = this.form.controls.qty.value || 0;
    return Math.round(qty * (this.data.batch.item_rate || 0) * 100) / 100;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const signedQty = v.direction === 'remove' ? -Math.abs(v.qty) : Math.abs(v.qty);
    this.saving.set(true);
    this.batchesService.adjust(this.data.batch.id, { qty: signedQty, reason: v.reason, remarks: v.remarks.trim() || undefined }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Stock adjustment saved.', 'Dismiss', { duration: 2500 });
        this.ref.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this adjustment.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
