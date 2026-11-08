import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreateStockTransferPayload,
  ReceiveStockTransferPayload,
  StockTransferContext,
  StockTransferDetail,
  StockTransferListRow,
} from '../models/stock-transfer.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class StockTransfersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/stock-transfers`;

  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<StockTransferListRow>>(this.base, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  get(id: number) {
    return this.http.get<StockTransferDetail>(`${this.base}/${id}`);
  }

  newContext(fromLocationId: number) {
    return this.http.get<StockTransferContext>(`${this.base}/new-context`, { params: { fromLocationId } });
  }

  create(payload: CreateStockTransferPayload) {
    return this.http.post<StockTransferDetail>(this.base, payload);
  }

  receive(id: number, payload: ReceiveStockTransferPayload) {
    return this.http.post<StockTransferDetail>(`${this.base}/${id}/receive`, payload);
  }

  cancel(id: number) {
    return this.http.post<StockTransferDetail>(`${this.base}/${id}/cancel`, {});
  }
}
