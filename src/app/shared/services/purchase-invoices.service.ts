import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreatePurchaseInvoicePayload,
  InvoiceSummary,
  NewInvoiceContext,
  PaymentStatusFilter,
  PurchaseInvoiceDetail,
  PurchaseInvoiceListRow,
  RecordPaymentPayload,
} from '../models/purchase-invoice.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class PurchaseInvoicesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/purchase-invoices`;

  listPaged(page: number, pageSize: number, status: PaymentStatusFilter | null, supplierId: number | null) {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (status) params['status'] = status;
    if (supplierId) params['supplierId'] = String(supplierId);
    return this.http.get<Paged<PurchaseInvoiceListRow>>(this.base, { params });
  }

  summary(supplierId: number | null) {
    const params: Record<string, string> = supplierId ? { supplierId: String(supplierId) } : {};
    return this.http.get<InvoiceSummary>(`${this.base}/summary`, { params });
  }

  get(id: number) {
    return this.http.get<PurchaseInvoiceDetail>(`${this.base}/${id}`);
  }

  newContext(grnId: number) {
    return this.http.get<NewInvoiceContext>(`${this.base}/new-context`, { params: { grnId } });
  }

  create(payload: CreatePurchaseInvoicePayload) {
    return this.http.post<PurchaseInvoiceDetail>(this.base, payload);
  }

  recordPayment(id: number, payload: RecordPaymentPayload) {
    return this.http.post<PurchaseInvoiceDetail>(`${this.base}/${id}/payments`, payload);
  }

  deletePayment(id: number, paymentId: number) {
    return this.http.delete<PurchaseInvoiceDetail>(`${this.base}/${id}/payments/${paymentId}`);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
