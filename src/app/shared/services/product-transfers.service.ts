import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreateProductTransferPayload,
  ProductStockRow,
  ProductTransferContext,
  ProductTransferDetail,
  ProductTransferListRow,
  ReceiveProductTransferPayload,
} from '../models/product-transfer.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class ProductTransfersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/product-transfers`;

  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<ProductTransferListRow>>(this.base, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  /** Finished pieces in hand by product and location. */
  stock() {
    return this.http.get<ProductStockRow[]>(`${this.base}/stock`);
  }

  get(id: number) {
    return this.http.get<ProductTransferDetail>(`${this.base}/${id}`);
  }

  newContext(fromLocationId: number) {
    return this.http.get<ProductTransferContext>(`${this.base}/new-context`, { params: { fromLocationId } });
  }

  create(payload: CreateProductTransferPayload) {
    return this.http.post<ProductTransferDetail>(this.base, payload);
  }

  receive(id: number, payload: ReceiveProductTransferPayload) {
    return this.http.post<ProductTransferDetail>(`${this.base}/${id}/receive`, payload);
  }

  cancel(id: number) {
    return this.http.post<ProductTransferDetail>(`${this.base}/${id}/cancel`, {});
  }
}
