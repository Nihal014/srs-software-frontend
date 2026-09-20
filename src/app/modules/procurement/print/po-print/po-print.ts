import { Component, afterNextRender, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PrintService } from 'app/print/services/print.service';
import { COMPANY } from 'app/print/company.const';
import type { Supplier } from 'app/shared/models/supplier.model';
import { PO_STATUS, PO_STATUS_LABEL, type PurchaseOrderDetail } from 'app/shared/models/purchase-order.model';

export interface PoPrintData {
  po: PurchaseOrderDetail;
  supplier: Supplier | null;
}

@Component({
  selector: 'app-po-print',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './po-print.html',
})
export class PoPrint {
  private printService = inject(PrintService);

  readonly company = COMPANY;
  readonly PO_STATUS = PO_STATUS;
  readonly statusLabel = PO_STATUS_LABEL;
  readonly printedOn = new Date();
  readonly data = this.printService.getData<PoPrintData>();

  constructor() {
    afterNextRender(() => {
      if (this.data) this.printService.onDataReady();
      else this.printService.cancel();
    });
  }
}
