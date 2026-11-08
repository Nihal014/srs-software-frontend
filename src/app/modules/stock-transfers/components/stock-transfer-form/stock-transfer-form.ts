import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { ConfirmService } from 'app/shared/services/confirm.service';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import { StockTransfersService } from 'app/shared/services/stock-transfers.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import type { StockTransferContext, TransferableBatch } from 'app/shared/models/stock-transfer.model';

function createLine(fb: FormBuilder, b: TransferableBatch) {
  return fb.nonNullable.group({
    batchId: b.batch_id,
    itemName: b.item_name,
    categoryName: b.category_name ?? '',
    unit: b.unit,
    batchNumber: b.batch_number,
    expiryDate: b.expiry_date,
    available: b.qty_available,
    qty: [0, [Validators.required, Validators.min(0), Validators.max(b.qty_available)]],
  });
}

type TransferLineGroup = ReturnType<typeof createLine>;

@Component({
  selector: 'app-stock-transfer-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './stock-transfer-form.html',
  styleUrl: './stock-transfer-form.scss',
})
export class StockTransferForm implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private locationsService = inject(DeliveryLocationsService);
  private transfersService = inject(StockTransfersService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly lineColumns = ['slno', 'item', 'category', 'batch', 'expiry', 'available', 'qty'];

  readonly locations = signal<DeliveryLocation[]>([]);
  readonly toLocations = computed(() => this.locations().filter((l) => !!l.is_active));
  readonly context = signal<StockTransferContext | null>(null);
  readonly loadingContext = signal(false);
  readonly saving = signal(false);
  // Mirrors the FormArray so mat-table re-renders when a different location is picked.
  readonly lineGroups = signal<TransferLineGroup[]>([]);

  readonly form = this.fb.group({
    fromLocationId: this.fb.control<number | null>(null, Validators.required),
    toLocationId: this.fb.control<number | null>(null, Validators.required),
    transferDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<TransferLineGroup>([]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.locationsService.listAll().subscribe((locations) => this.locations.set(locations));
    this.form.controls.fromLocationId.valueChanges.subscribe((id) => this.loadContext(id));
  }

  private loadContext(locationId: number | null) {
    this.context.set(null);
    this.lines.clear();
    this.lineGroups.set([]);
    if (!locationId) return;
    this.loadingContext.set(true);
    this.transfersService.newContext(locationId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        ctx.batches.forEach((b) => this.lines.push(createLine(this.fb, b)));
        this.lineGroups.set([...this.lines.controls]);
        this.loadingContext.set(false);
      },
      error: (err) => {
        this.loadingContext.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this location.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  get totals() {
    return { lines: this.lines.getRawValue().filter((l) => l.qty > 0).length };
  }

  qtyError(line: TransferLineGroup): string | null {
    const qty = line.controls.qty;
    if (!qty.touched) return null;
    if (qty.hasError('max')) return `only ${line.controls.available.value} available`;
    if (qty.invalid) return 'enter 0 or more';
    return null;
  }

  private locationName(id: number | null) {
    return this.locations().find((l) => l.id === id)?.name ?? '';
  }

  send() {
    const { fromLocationId, toLocationId, transferDate, remarks } = this.form.getRawValue();
    if (!fromLocationId || !toLocationId) {
      this.form.markAllAsTouched();
      this.snackBar.open('Choose both locations.', 'Dismiss', { duration: 3000 });
      return;
    }
    if (fromLocationId === toLocationId) {
      this.snackBar.open('Choose two different locations.', 'Dismiss', { duration: 3000 });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted lines before sending.', 'Dismiss', { duration: 3000 });
      return;
    }
    const sending = this.lines.getRawValue().filter((l) => l.qty > 0);
    if (!sending.length) {
      this.snackBar.open('Enter a quantity to send on at least one batch.', 'Dismiss', { duration: 3000 });
      return;
    }
    const to = this.locationName(toLocationId);
    this.confirmService
      .ask({
        title: 'Send transfer (LTO)',
        message: `Send ${sending.length} batch${sending.length === 1 ? '' : 'es'} from ${this.locationName(fromLocationId)} to ${to}? The stock leaves ${this.locationName(fromLocationId)} now and stays in transit until ${to} confirms receipt (LTI).`,
        confirmLabel: 'Send',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.transfersService
          .create({
            fromLocationId,
            toLocationId,
            transferDate,
            remarks: remarks.trim() || undefined,
            lines: sending.map((l) => ({ batchId: l.batchId, qty: l.qty })),
          })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.transfer_number} sent.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/stock-transfers', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not send this transfer.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
