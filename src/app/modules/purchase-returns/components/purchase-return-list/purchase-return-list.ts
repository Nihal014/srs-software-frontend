import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { AuthService } from 'app/core/services/auth.service';
import { PurchaseReturnsService } from 'app/shared/services/purchase-returns.service';
import {
  PURCHASE_RETURN_CREDIT,
  PURCHASE_RETURN_CREDIT_LABEL,
  type PurchaseReturnCredit,
  type PurchaseReturnListRow,
} from 'app/shared/models/purchase-return.model';

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './purchase-return-list.html',
})
export class PurchaseReturnList implements OnInit {
  private returnsService = inject(PurchaseReturnsService);
  readonly auth = inject(AuthService);

  readonly creditText = (credit: PurchaseReturnCredit) => PURCHASE_RETURN_CREDIT_LABEL[credit];
  readonly CREDIT = PURCHASE_RETURN_CREDIT;
  readonly columns = ['slno', 'return_number', 'grn_number', 'supplier_name', 'return_date', 'item_names', 'total_amount', 'credit_status'];
  readonly rows = signal<PurchaseReturnListRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.returnsService.listPaged(this.page(), this.pageSize()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }
}
