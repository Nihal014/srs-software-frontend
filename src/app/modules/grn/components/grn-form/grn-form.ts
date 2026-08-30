import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GrnService } from '../../grn.service';
import type { GrnContext, GrnDetail } from 'app/shared/models/grn.model';
import { PO_STATUS_LABEL, type PoStatus } from 'app/shared/models/purchase-order.model';

interface EditableGrnLine {
  purchaseOrderLineId: number;
  itemName: string;
  unit: string;
  ordered: number;
  priorReceived: number;
  outstanding: number;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  rejectionReason: string;
  mfgDate: string;
  expiryDate: string;
  error: string | null;
}

@Component({
  selector: 'app-grn-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DecimalPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './grn-form.html',
  styleUrl: './grn-form.scss',
})
export class GrnForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private grnService = inject(GrnService);
  private snackBar = inject(MatSnackBar);

  readonly lineColumns = [
    'item',
    'ordered',
    'prior',
    'outstanding',
    'received',
    'accepted',
    'rejected',
    'reason',
    'mfg',
    'exp',
  ];

  statusLabelFor(status: PoStatus): string {
    return PO_STATUS_LABEL[status];
  }

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly viewing = signal(false);
  readonly context = signal<GrnContext | null>(null);
  readonly detail = signal<GrnDetail | null>(null);

  poId: number | null = null;
  lines: EditableGrnLine[] = [];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.viewing.set(true);
      this.grnService.get(Number(idParam)).subscribe((detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      });
      return;
    }

    const poIdParam = this.route.snapshot.queryParamMap.get('poId');
    this.poId = poIdParam ? Number(poIdParam) : null;
    if (!this.poId) {
      this.loading.set(false);
      return;
    }
    this.grnService.newContext(this.poId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        this.lines = ctx.lines.map((l) => ({
          purchaseOrderLineId: l.purchase_order_line_id,
          itemName: l.item_name,
          unit: l.unit,
          ordered: l.qty_ordered,
          priorReceived: l.prior_received,
          outstanding: l.outstanding,
          qtyReceived: l.suggested.qtyReceived,
          qtyAccepted: l.suggested.qtyAccepted,
          qtyRejected: l.suggested.qtyRejected,
          rejectionReason: '',
          mfgDate: l.suggested.mfgDate,
          expiryDate: l.suggested.expiryDate,
          error: null,
        }));
        this.validateLines();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this purchase order.', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  validateLines() {
    let anyError = false;
    for (const l of this.lines) {
      l.error = null;
      if (l.qtyReceived > l.outstanding) {
        l.error = `Received ${l.qtyReceived} exceeds outstanding ${l.outstanding}.`;
      } else if (l.qtyAccepted + l.qtyRejected !== l.qtyReceived) {
        l.error = `Accepted + rejected (${l.qtyAccepted + l.qtyRejected}) must equal received (${l.qtyReceived}).`;
      } else if (l.qtyRejected > 0 && !l.rejectionReason.trim()) {
        l.error = 'A rejection reason is required.';
      }
      if (l.error) anyError = true;
    }
    return anyError;
  }

  get hasErrors() {
    return this.lines.some((l) => l.error);
  }

  get totals() {
    return this.lines.reduce(
      (a, l) => ({
        received: a.received + (l.qtyReceived || 0),
        accepted: a.accepted + (l.qtyAccepted || 0),
        rejected: a.rejected + (l.qtyRejected || 0),
      }),
      { received: 0, accepted: 0, rejected: 0 },
    );
  }

  post() {
    if (!this.poId) return;
    this.validateLines();
    if (this.hasErrors) {
      this.snackBar.open('Fix the highlighted lines before posting.', 'Dismiss', { duration: 3000 });
      return;
    }
    const linesToPost = this.lines.filter((l) => l.qtyReceived > 0);
    if (!linesToPost.length) {
      this.snackBar.open('Enter a received quantity on at least one line.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.grnService
      .create({
        poId: this.poId,
        lines: linesToPost.map((l) => ({
          purchaseOrderLineId: l.purchaseOrderLineId,
          qtyReceived: l.qtyReceived,
          qtyAccepted: l.qtyAccepted,
          qtyRejected: l.qtyRejected,
          rejectionReason: l.rejectionReason || undefined,
          mfgDate: l.mfgDate,
          expiryDate: l.expiryDate,
        })),
      })
      .subscribe({
        next: (grn) => {
          this.saving.set(false);
          this.snackBar.open(`Posted ${grn.grn_number} — ${this.totals.accepted} units added to stock.`, 'Dismiss', {
            duration: 3500,
          });
          this.router.navigate(['/grn', grn.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message ?? 'Could not post this GRN.', 'Dismiss', { duration: 4000 });
        },
      });
  }
}
