import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/services/auth.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { ProductTransfersService } from 'app/shared/services/product-transfers.service';
import { toDateString } from 'app/shared/utils/date.util';
import {
  PRODUCT_TRANSFER_STATUS,
  PRODUCT_TRANSFER_STATUS_CHIP,
  PRODUCT_TRANSFER_STATUS_LABEL,
  type ProductTransferDetail,
  type ProductTransferLine,
} from 'app/shared/models/product-transfer.model';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function createReceiveLine(fb: FormBuilder, l: ProductTransferLine) {
  return fb.nonNullable.group({
    lineId: l.id,
    productName: l.product_name,
    unit: l.output_unit,
    lotNumber: l.source_lot_number,
    sent: l.qty_sent,
    qtyReceived: [l.qty_sent, [Validators.required, Validators.min(0), Validators.max(l.qty_sent)]],
  });
}

type ReceiveLineGroup = ReturnType<typeof createReceiveLine>;

@Component({
  selector: 'app-product-transfer-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-transfer-detail.html',
  styleUrl: './product-transfer-detail.scss',
})
export class ProductTransferDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private transfersService = inject(ProductTransfersService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly STATUS = PRODUCT_TRANSFER_STATUS;
  readonly statusText = PRODUCT_TRANSFER_STATUS_LABEL;
  readonly statusChip = PRODUCT_TRANSFER_STATUS_CHIP;
  readonly viewColumns = ['slno', 'product', 'lot', 'sent', 'received', 'loss', 'newLot'];
  readonly receiveColumns = ['slno', 'product', 'lot', 'sent', 'received', 'loss'];

  readonly detail = signal<ProductTransferDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly receiveLines = signal<ReceiveLineGroup[]>([]);

  readonly receiveForm = this.fb.group({
    receivedDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<ReceiveLineGroup>([]),
  });

  get lines() {
    return this.receiveForm.controls.lines;
  }

  ngOnInit() {
    this.transfersService.get(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (detail) => this.apply(detail),
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this transfer.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private apply(detail: ProductTransferDetail) {
    this.detail.set(detail);
    this.lines.clear();
    if (detail.status === PRODUCT_TRANSFER_STATUS.InTransit) {
      detail.lines.forEach((l) => this.lines.push(createReceiveLine(this.fb, l)));
    }
    this.receiveLines.set([...this.lines.controls]);
    this.loading.set(false);
  }

  lossOf(line: ProductTransferLine | ReceiveLineGroup): number {
    if ('controls' in line) return round3(line.controls.sent.value - (line.controls.qtyReceived.value || 0));
    return round3(line.qty_sent - (line.qty_received ?? 0));
  }

  qtyError(line: ReceiveLineGroup): string | null {
    const qty = line.controls.qtyReceived;
    if (!qty.touched) return null;
    if (qty.hasError('max')) return `can't be more than the ${line.controls.sent.value} sent`;
    if (qty.invalid) return 'enter 0 or more';
    return null;
  }

  get totalLoss() {
    return round3(this.lines.getRawValue().reduce((a, l) => a + (l.sent - (l.qtyReceived || 0)), 0));
  }

  confirmReceipt(detail: ProductTransferDetail) {
    if (this.receiveForm.invalid) {
      this.receiveForm.markAllAsTouched();
      this.snackBar.open('Fix the highlighted lines before confirming.', 'Dismiss', { duration: 3000 });
      return;
    }
    const loss = this.totalLoss;
    const note = loss > 0 ? ` The ${loss} short is recorded as a transfer loss.` : '';
    this.confirmService
      .ask({
        title: 'Confirm receipt (LTI)',
        message: `Confirm that ${detail.to_location_name} received these products?${note} It can't be undone.`,
        confirmLabel: 'Confirm receipt',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const { receivedDate, remarks, lines } = this.receiveForm.getRawValue();
        this.saving.set(true);
        this.transfersService
          .receive(detail.id, {
            receivedDate,
            remarks: remarks.trim() || undefined,
            lines: lines.map((l) => ({ lineId: l.lineId, qtyReceived: l.qtyReceived })),
          })
          .subscribe({
            next: (updated) => {
              this.saving.set(false);
              this.apply(updated);
              this.snackBar.open(`${updated.receipt_number} recorded.`, 'Dismiss', { duration: 3000 });
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record the receipt.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }

  cancelTransfer(detail: ProductTransferDetail) {
    this.confirmService
      .ask({
        title: 'Cancel transfer',
        message: `Cancel ${detail.transfer_number}? The pieces go back to ${detail.from_location_name}.`,
        confirmLabel: 'Cancel transfer',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.transfersService.cancel(detail.id).subscribe({
          next: (updated) => {
            this.saving.set(false);
            this.apply(updated);
            this.snackBar.open('Transfer cancelled.', 'Dismiss', { duration: 2500 });
          },
          error: (err) => {
            this.saving.set(false);
            this.snackBar.open(err.error?.message ?? 'Could not cancel this transfer.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
