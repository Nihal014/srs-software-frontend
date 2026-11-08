import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import type { DeliveryNoteDetail } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-delivery-note-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delivery-note-detail.html',
})
export class DeliveryNoteDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private salesDocs = inject(SalesDocsService);
  private snackBar = inject(MatSnackBar);

  readonly columns = ['slno', 'product', 'ordered', 'delivered'];
  readonly detail = signal<DeliveryNoteDetail | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.salesDocs.deliveryNote(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this delivery note.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
