import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { ORDER_STATUS, orderChip, orderLabel, type SalesOrderDetail } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-order-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './sales-order-detail.html',
})
export class SalesOrderDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private salesDocs = inject(SalesDocsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly STATUS = ORDER_STATUS;
  readonly label = orderLabel;
  readonly chip = orderChip;
  readonly columns = ['slno', 'product', 'qty', 'delivered', 'rate', 'tax', 'discount', 'amount'];
  readonly detail = signal<SalesOrderDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit() {
    this.salesDocs.order(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this order.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  cancel(d: SalesOrderDetail) {
    this.confirmService
      .ask({ title: 'Cancel order', message: `Cancel ${d.order_number}? Nothing has been delivered against it.`, confirmLabel: 'Cancel order', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs.cancelOrder(d.id).subscribe({
          next: (updated) => {
            this.saving.set(false);
            this.detail.set(updated);
            this.snackBar.open('Order cancelled.', 'Dismiss', { duration: 2500 });
          },
          error: (err) => {
            this.saving.set(false);
            this.snackBar.open(err.error?.message ?? 'Could not cancel this order.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
