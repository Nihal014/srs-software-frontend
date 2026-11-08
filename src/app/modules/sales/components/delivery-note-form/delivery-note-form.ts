import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { ORDER_STATUS, type DeliveryNoteContext, type SalesOrderListRow } from 'app/shared/models/sales-docs.model';

type ContextLine = DeliveryNoteContext['lines'][number];

function createLine(fb: FormBuilder, l: ContextLine) {
  return fb.nonNullable.group({
    orderLineId: l.order_line_id,
    productName: l.product_name,
    unit: l.unit,
    ordered: l.qty_ordered,
    delivered: l.qty_delivered,
    outstanding: l.outstanding,
    qty: [l.outstanding, [Validators.required, Validators.min(0), Validators.max(l.outstanding)]],
  });
}

type DeliveryLineGroup = ReturnType<typeof createLine>;

@Component({
  selector: 'app-delivery-note-form',
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
  templateUrl: './delivery-note-form.html',
  styleUrl: './delivery-note-form.scss',
})
export class DeliveryNoteForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private salesDocs = inject(SalesDocsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly lineColumns = ['slno', 'product', 'ordered', 'delivered', 'outstanding', 'qty'];
  readonly orders = signal<SalesOrderListRow[]>([]);
  readonly context = signal<DeliveryNoteContext | null>(null);
  readonly loadingContext = signal(false);
  readonly saving = signal(false);
  readonly lineGroups = signal<DeliveryLineGroup[]>([]);

  readonly form = this.fb.group({
    orderId: this.fb.control<number | null>(null, Validators.required),
    deliveryDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    receivedBy: this.fb.nonNullable.control(''),
    vehicleNo: this.fb.nonNullable.control(''),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<DeliveryLineGroup>([]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.salesDocs.orders(1, 200, null).subscribe((res) => {
      this.orders.set(res.rows.filter((o) => o.status === ORDER_STATUS.Open || o.status === ORDER_STATUS.PartiallyDelivered));
      const preset = Number(this.route.snapshot.queryParamMap.get('orderId'));
      if (preset) this.form.controls.orderId.setValue(preset);
    });
    this.form.controls.orderId.valueChanges.subscribe((id) => this.loadContext(id));
  }

  private loadContext(orderId: number | null) {
    this.context.set(null);
    this.lines.clear();
    this.lineGroups.set([]);
    if (!orderId) return;
    this.loadingContext.set(true);
    this.salesDocs.deliveryNoteContext(orderId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        ctx.lines.forEach((l) => this.lines.push(createLine(this.fb, l)));
        this.lineGroups.set([...this.lines.controls]);
        this.loadingContext.set(false);
      },
      error: (err) => {
        this.loadingContext.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this order.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  qtyError(line: DeliveryLineGroup): string | null {
    const qty = line.controls.qty;
    if (!qty.touched) return null;
    if (qty.hasError('max')) return `only ${line.controls.outstanding.value} left to deliver`;
    if (qty.invalid) return 'enter 0 or more';
    return null;
  }

  get totals() {
    return { lines: this.lines.getRawValue().filter((l) => l.qty > 0).length };
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
    const delivering = v.lines.filter((l) => l.qty > 0);
    if (!delivering.length) {
      this.snackBar.open('Enter a delivered quantity on at least one line.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.confirmService
      .ask({
        title: 'Record delivery',
        message: `Record this delivery to ${ctx.order.customer_name} against ${ctx.order.order_number}?`,
        confirmLabel: 'Record delivery',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs
          .createDeliveryNote({
            salesOrderId: ctx.order.id,
            deliveryDate: v.deliveryDate,
            receivedBy: v.receivedBy.trim() || undefined,
            vehicleNo: v.vehicleNo.trim() || undefined,
            remarks: v.remarks.trim() || undefined,
            lines: delivering.map((l) => ({ orderLineId: l.orderLineId, qty: l.qty })),
          })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.dn_number} recorded.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/sales/delivery-notes', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this delivery.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
