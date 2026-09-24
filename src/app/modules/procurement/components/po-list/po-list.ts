import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { PoService } from '../../po.service';
import { PoCreateDialog } from '../po-create-dialog/po-create-dialog';
import {
  PO_STATUS,
  PO_STATUS_LABEL,
  PO_STATUS_SLUG,
  type PoListRow,
  type PoStatus,
} from 'app/shared/models/purchase-order.model';

interface StatusFilter {
  label: string;
  value: PoStatus | null;
}

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './po-list.html',
  styleUrl: './po-list.scss',
})
export class PoList implements OnInit {
  private poService = inject(PoService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  readonly displayedColumns = [
    'slno',
    'po_number',
    'supplier_name',
    'status',
    'qty_ordered',
    'qty_received',
    'qtyOutstanding',
    'value',
    'action',
  ];

  readonly statusFilters: StatusFilter[] = [
    { label: 'All statuses', value: null },
    ...Object.values(PO_STATUS).map((value) => ({ label: PO_STATUS_LABEL[value], value })),
  ];

  readonly rows = signal<PoListRow[]>([]);
  readonly loading = signal(true);
  readonly activeStatus = signal<PoStatus | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  statusLabelFor(status: PoStatus): string {
    return PO_STATUS_LABEL[status];
  }

  statusSlugFor(status: PoStatus): string {
    return PO_STATUS_SLUG[status];
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.poService.listPaged(this.page(), this.pageSize(), this.activeStatus() ?? undefined).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  setStatusFilter(status: PoStatus | null) {
    this.activeStatus.set(status);
    this.page.set(1);
    this.load();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  createNew() {
    const dialogRef = this.dialog.open(PoCreateDialog, {
      panelClass: ['rb-dialog-container', 'w-[940px]', 'h-[95vh]', 'max-w-[95vw]'],
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((po) => {
      if (po) this.router.navigate(['/procurement', po.id]);
    });
  }
}
