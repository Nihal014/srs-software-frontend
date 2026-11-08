import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { QUOTATION_STATUS, quotationChip, quotationLabel, type QuotationDetail } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-quotation-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './quotation-detail.html',
})
export class QuotationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private salesDocs = inject(SalesDocsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  readonly STATUS = QUOTATION_STATUS;
  readonly label = quotationLabel;
  readonly chip = quotationChip;
  readonly columns = ['slno', 'product', 'qty', 'rate', 'tax', 'discount', 'amount'];
  readonly detail = signal<QuotationDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  ngOnInit() {
    this.salesDocs.quotation(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this quotation.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private run(title: string, message: string, confirmLabel: string, action: () => void, destructive = false) {
    this.confirmService.ask({ title, message, confirmLabel, destructive }).subscribe((ok) => {
      if (ok) action();
    });
  }

  private afterChange(updated: QuotationDetail, text: string) {
    this.saving.set(false);
    this.detail.set(updated);
    this.snackBar.open(text, 'Dismiss', { duration: 2500 });
  }

  private fail(err: { error?: { message?: string } }, fallback: string) {
    this.saving.set(false);
    this.snackBar.open(err.error?.message ?? fallback, 'Dismiss', { duration: 5000 });
  }

  accept(d: QuotationDetail) {
    this.run('Accept quotation', `Mark ${d.quotation_number} as accepted by ${d.customer_name}?`, 'Accept', () => {
      this.saving.set(true);
      this.salesDocs.acceptQuotation(d.id).subscribe({ next: (u) => this.afterChange(u, 'Quotation accepted.'), error: (e) => this.fail(e, 'Could not accept.') });
    });
  }

  reject(d: QuotationDetail) {
    this.run('Reject quotation', `Mark ${d.quotation_number} as rejected?`, 'Reject', () => {
      this.saving.set(true);
      this.salesDocs.rejectQuotation(d.id).subscribe({ next: (u) => this.afterChange(u, 'Quotation rejected.'), error: (e) => this.fail(e, 'Could not reject.') });
    }, true);
  }

  convert(d: QuotationDetail) {
    this.run('Create sales order', `Create a sales order from ${d.quotation_number} with the same customer and lines?`, 'Create order', () => {
      this.saving.set(true);
      this.salesDocs.convertQuotation(d.id).subscribe({
        next: (order) => {
          this.saving.set(false);
          this.snackBar.open(`${order.order_number} created.`, 'Dismiss', { duration: 3000 });
          this.router.navigate(['/sales/orders', order.id]);
        },
        error: (e) => this.fail(e, 'Could not create the order.'),
      });
    });
  }

  remove(d: QuotationDetail) {
    this.run('Delete quotation', `Delete ${d.quotation_number}? This can't be undone.`, 'Delete', () => {
      this.salesDocs.removeQuotation(d.id).subscribe({
        next: () => {
          this.snackBar.open('Quotation deleted.', 'Dismiss', { duration: 2500 });
          this.router.navigate(['/sales/quotations']);
        },
        error: (e) => this.fail(e, 'Could not delete this quotation.'),
      });
    }, true);
  }
}
