import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { SALES_RETURN_REASON_LABEL, type SalesReturnDetail, type SalesReturnReason } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-return-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './sales-return-detail.html',
})
export class SalesReturnDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private salesDocs = inject(SalesDocsService);
  private snackBar = inject(MatSnackBar);

  readonly reasonText = (reason: SalesReturnReason) => SALES_RETURN_REASON_LABEL[reason];
  readonly columns = ['slno', 'product', 'qty', 'amount', 'reason'];
  readonly detail = signal<SalesReturnDetail | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.salesDocs.salesReturn(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this return.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
