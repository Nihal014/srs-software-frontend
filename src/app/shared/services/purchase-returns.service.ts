import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreatePurchaseReturnPayload,
  PurchaseReturnContext,
  PurchaseReturnDetail,
  PurchaseReturnListRow,
} from '../models/purchase-return.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/purchase-returns`;

  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<PurchaseReturnListRow>>(this.base, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  get(id: number) {
    return this.http.get<PurchaseReturnDetail>(`${this.base}/${id}`);
  }

  newContext(grnId: number) {
    return this.http.get<PurchaseReturnContext>(`${this.base}/new-context`, { params: { grnId } });
  }

  create(payload: CreatePurchaseReturnPayload) {
    return this.http.post<PurchaseReturnDetail>(this.base, payload);
  }

  markCreditReceived(id: number) {
    return this.http.post<PurchaseReturnDetail>(`${this.base}/${id}/credit-received`, {});
  }
}
