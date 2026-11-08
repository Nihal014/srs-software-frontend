import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/services/auth.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { PurchaseReturnsService } from 'app/shared/services/purchase-returns.service';
import {
  PURCHASE_RETURN_CREDIT,
  PURCHASE_RETURN_CREDIT_LABEL,
  PURCHASE_RETURN_REASON_LABEL,
  type PurchaseReturnDetail,
  type PurchaseReturnReason,
} from 'app/shared/models/purchase-return.model';

@Component({
  selector: 'app-purchase-return-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './purchase-return-detail.html',
})
export class PurchaseReturnDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private returnsService = inject(PurchaseReturnsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly CREDIT = PURCHASE_RETURN_CREDIT;
  readonly creditLabel = PURCHASE_RETURN_CREDIT_LABEL;
  readonly reasonText = (reason: PurchaseReturnReason) => PURCHASE_RETURN_REASON_LABEL[reason];
  readonly columns = ['slno', 'item', 'category', 'batch', 'qty', 'rate', 'amount', 'reason'];
  readonly detail = signal<PurchaseReturnDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit() {
    this.returnsService.get(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this return.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  markCreditReceived(detail: PurchaseReturnDetail) {
    this.confirmService
      .ask({
        title: 'Mark credit received',
        message: `Has ${detail.supplier_name} refunded Rs ${detail.total_amount.toFixed(2)} or set it against a later bill? This can't be undone.`,
        confirmLabel: 'Mark received',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.returnsService.markCreditReceived(detail.id).subscribe({
          next: (updated) => {
            this.saving.set(false);
            this.detail.set(updated);
            this.snackBar.open('Credit marked as received.', 'Dismiss', { duration: 2500 });
          },
          error: (err) => {
            this.saving.set(false);
            this.snackBar.open(err.error?.message ?? 'Could not update this return.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
