import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GrnService } from '../../grn.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import type { GrnContext, GrnContextLine, GrnDetail } from 'app/shared/models/grn.model';
import { PO_STATUS_LABEL, type PoStatus } from 'app/shared/models/purchase-order.model';

/** Cross-field rules for one GRN line: within outstanding, accepted + rejected = received, reason when rejecting. */
function grnLineValidator(group: AbstractControl): ValidationErrors | null {
  const v = group.value;
  const received = v.qtyReceived ?? 0;
  const accepted = v.qtyAccepted ?? 0;
  const rejected = v.qtyRejected ?? 0;
  if (received > v.outstanding) {
    return { lineError: `Received ${received} exceeds outstanding ${v.outstanding}.` };
  }
  if (accepted + rejected !== received) {
    return { lineError: `Accepted + rejected (${accepted + rejected}) must equal received (${received}).` };
  }
  if (rejected > 0 && !String(v.rejectionReason ?? '').trim()) {
    return { lineError: 'A rejection reason is required.' };
  }
  return null;
}

function createGrnLineGroup(fb: FormBuilder, l: GrnContextLine) {
  return fb.nonNullable.group(
    {
      purchaseOrderLineId: l.purchase_order_line_id,
      itemName: l.item_name,
      unit: l.unit,
      ordered: l.qty_ordered,
      priorReceived: l.prior_received,
      outstanding: l.outstanding,
      qtyReceived: [l.suggested.qtyReceived, [Validators.required, Validators.min(0)]],
      qtyAccepted: [l.suggested.qtyAccepted, [Validators.required, Validators.min(0)]],
      qtyRejected: [l.suggested.qtyRejected, [Validators.required, Validators.min(0)]],
      rejectionReason: '',
      mfgDate: [l.suggested.mfgDate, [Validators.required]],
      expiryDate: [l.suggested.expiryDate, [Validators.required]],
    },
    { validators: [grnLineValidator] },
  );
}

type GrnLineGroup = ReturnType<typeof createGrnLineGroup>;
import { ConfirmService } from 'app/shared/services/confirm.service';

@Component({
  selector: 'app-grn-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DateField,
    DecimalPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
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
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  readonly lineColumns = [
    'slno',
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

  readonly form = this.fb.group({ lines: this.fb.array<GrnLineGroup>([]) });

  get lines() {
    return this.form.controls.lines;
  }

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
        ctx.lines.forEach((l) => this.lines.push(createGrnLineGroup(this.fb, l)));
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

  lineError(group: AbstractControl): string | null {
    return group.errors?.['lineError'] ?? null;
  }

  get totals() {
    return this.lines.getRawValue().reduce(
      (a, l) => ({
        received: a.received + (l.qtyReceived || 0),
        accepted: a.accepted + (l.qtyAccepted || 0),
        rejected: a.rejected + (l.qtyRejected || 0),
      }),
      { received: 0, accepted: 0, rejected: 0 },
    );
  }

  post() {
    const poId = this.poId;
    if (!poId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted lines before posting.', 'Dismiss', { duration: 3000 });
      return;
    }
    const linesToPost = this.lines.getRawValue().filter((l) => l.qtyReceived > 0);
    if (!linesToPost.length) {
      this.snackBar.open('Enter a received quantity on at least one line.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.confirmService
      .ask({
        title: 'Post goods receipt',
        message: `Post this GRN? ${this.totals.accepted} units will be added to stock and it can't be undone.`,
        confirmLabel: 'Post GRN',
      })
      .subscribe((confirmed) => {
        if (confirmed) this.submitGrn(poId, linesToPost);
      });
  }

  private submitGrn(poId: number, linesToPost: ReturnType<GrnForm['lines']['getRawValue']>) {
    this.saving.set(true);
    this.grnService
      .create({
        poId,
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
