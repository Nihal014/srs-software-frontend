import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreatePoPayload,
  PoListRow,
  PoStatus,
  PurchaseOrderDetail,
} from 'app/shared/models/purchase-order.model';
import type { Paged } from 'app/shared/models/paged.model';

@Injectable({ providedIn: 'root' })
export class PoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/purchase-orders`;

  list(status?: PoStatus) {
    const params: Record<string, string> = {};
    if (status) params['status'] = String(status);
    return this.http.get<PoListRow[]>(this.base, { params });
  }

  /** Paged PO list for the Purchase Orders screen. */
  listPaged(page: number, pageSize: number, status?: PoStatus) {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (status) params['status'] = String(status);
    return this.http.get<Paged<PoListRow>>(this.base, { params });
  }

  get(id: number) {
    return this.http.get<PurchaseOrderDetail>(`${this.base}/${id}`);
  }

  create(payload: CreatePoPayload) {
    return this.http.post<PurchaseOrderDetail>(this.base, payload);
  }

  update(id: number, payload: Partial<CreatePoPayload>) {
    return this.http.patch<PurchaseOrderDetail>(`${this.base}/${id}`, payload);
  }

  sendForApproval(id: number) {
    return this.http.post<PurchaseOrderDetail>(`${this.base}/${id}/send-for-approval`, {});
  }

  approve(id: number, acknowledgeThreshold = false) {
    return this.http.post<PurchaseOrderDetail>(`${this.base}/${id}/approve`, {
      acknowledgeThreshold,
    });
  }

  sendToSupplier(id: number) {
    return this.http.post<PurchaseOrderDetail>(`${this.base}/${id}/send-to-supplier`, {});
  }

  close(id: number) {
    return this.http.post<PurchaseOrderDetail>(`${this.base}/${id}/close`, {});
  }
}
