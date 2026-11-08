import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Paged } from '../models/paged.model';
import type { InvoiceSummary, PaymentStatusFilter } from '../models/purchase-invoice.model';
import type {
  CreateDeliveryNotePayload,
  CreateQuotationPayload,
  CreateSalesInvoicePayload,
  CreateSalesOrderPayload,
  CreateSalesReturnPayload,
  DeliveryNoteContext,
  DeliveryNoteDetail,
  DeliveryNoteListRow,
  InvoiceContext,
  QuotationDetail,
  QuotationListRow,
  RecordSalesPaymentPayload,
  SalesInvoiceDetail,
  SalesInvoiceListRow,
  SalesLocation,
  SalesOrderDetail,
  SalesOrderListRow,
  SalesReturnContext,
  SalesReturnDetail,
  SalesReturnListRow,
  UpsertSalesLocationPayload,
} from '../models/sales-docs.model';

const api = environment.apiUrl;

/** One client for the whole Sales section: locations, quotations, orders, delivery notes, invoices and returns. */
@Injectable({ providedIn: 'root' })
export class SalesDocsService {
  private http = inject(HttpClient);

  private page(page: number, pageSize: number, extra: Record<string, string | number | null | undefined> = {}) {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    for (const [k, v] of Object.entries(extra)) if (v !== null && v !== undefined && v !== '') params[k] = String(v);
    return params;
  }

  // ---- sales locations
  locations() {
    return this.http.get<SalesLocation[]>(`${api}/sales-locations`);
  }
  locationsAll() {
    return this.http.get<SalesLocation[]>(`${api}/sales-locations`, { params: { all: 'true' } });
  }
  createLocation(payload: UpsertSalesLocationPayload) {
    return this.http.post<SalesLocation>(`${api}/sales-locations`, payload);
  }
  updateLocation(id: number, payload: UpsertSalesLocationPayload) {
    return this.http.patch<SalesLocation>(`${api}/sales-locations/${id}`, payload);
  }
  removeLocation(id: number) {
    return this.http.delete<void>(`${api}/sales-locations/${id}`);
  }

  // ---- quotations
  quotations(page: number, pageSize: number, status: number | null) {
    return this.http.get<Paged<QuotationListRow>>(`${api}/quotations`, { params: this.page(page, pageSize, { status }) });
  }
  quotation(id: number) {
    return this.http.get<QuotationDetail>(`${api}/quotations/${id}`);
  }
  createQuotation(payload: CreateQuotationPayload) {
    return this.http.post<QuotationDetail>(`${api}/quotations`, payload);
  }
  acceptQuotation(id: number) {
    return this.http.post<QuotationDetail>(`${api}/quotations/${id}/accept`, {});
  }
  rejectQuotation(id: number) {
    return this.http.post<QuotationDetail>(`${api}/quotations/${id}/reject`, {});
  }
  convertQuotation(id: number) {
    return this.http.post<SalesOrderDetail>(`${api}/quotations/${id}/convert`, {});
  }
  removeQuotation(id: number) {
    return this.http.delete<void>(`${api}/quotations/${id}`);
  }

  // ---- sales orders
  orders(page: number, pageSize: number, status: number | null) {
    return this.http.get<Paged<SalesOrderListRow>>(`${api}/sales-orders`, { params: this.page(page, pageSize, { status }) });
  }
  order(id: number) {
    return this.http.get<SalesOrderDetail>(`${api}/sales-orders/${id}`);
  }
  createOrder(payload: CreateSalesOrderPayload) {
    return this.http.post<SalesOrderDetail>(`${api}/sales-orders`, payload);
  }
  cancelOrder(id: number) {
    return this.http.post<SalesOrderDetail>(`${api}/sales-orders/${id}/cancel`, {});
  }

  // ---- delivery notes
  deliveryNotes(page: number, pageSize: number) {
    return this.http.get<Paged<DeliveryNoteListRow>>(`${api}/delivery-notes`, { params: this.page(page, pageSize) });
  }
  deliveryNote(id: number) {
    return this.http.get<DeliveryNoteDetail>(`${api}/delivery-notes/${id}`);
  }
  deliveryNoteContext(orderId: number) {
    return this.http.get<DeliveryNoteContext>(`${api}/delivery-notes/new-context`, { params: { orderId } });
  }
  createDeliveryNote(payload: CreateDeliveryNotePayload) {
    return this.http.post<DeliveryNoteDetail>(`${api}/delivery-notes`, payload);
  }

  // ---- sales invoices
  invoices(page: number, pageSize: number, status: PaymentStatusFilter | null, customerId: number | null) {
    return this.http.get<Paged<SalesInvoiceListRow>>(`${api}/sales-invoices`, { params: this.page(page, pageSize, { status, customerId }) });
  }
  invoiceSummary(customerId: number | null) {
    const params: Record<string, string> = customerId ? { customerId: String(customerId) } : {};
    return this.http.get<InvoiceSummary>(`${api}/sales-invoices/summary`, { params });
  }
  invoice(id: number) {
    return this.http.get<SalesInvoiceDetail>(`${api}/sales-invoices/${id}`);
  }
  invoiceContext(deliveryNoteId: number) {
    return this.http.get<InvoiceContext>(`${api}/sales-invoices/new-context`, { params: { deliveryNoteId } });
  }
  createInvoice(payload: CreateSalesInvoicePayload) {
    return this.http.post<SalesInvoiceDetail>(`${api}/sales-invoices`, payload);
  }
  recordInvoicePayment(id: number, payload: RecordSalesPaymentPayload) {
    return this.http.post<SalesInvoiceDetail>(`${api}/sales-invoices/${id}/payments`, payload);
  }
  deleteInvoicePayment(id: number, paymentId: number) {
    return this.http.delete<SalesInvoiceDetail>(`${api}/sales-invoices/${id}/payments/${paymentId}`);
  }
  removeInvoice(id: number) {
    return this.http.delete<void>(`${api}/sales-invoices/${id}`);
  }

  // ---- sales returns
  returns(page: number, pageSize: number) {
    return this.http.get<Paged<SalesReturnListRow>>(`${api}/sales-returns`, { params: this.page(page, pageSize) });
  }
  salesReturn(id: number) {
    return this.http.get<SalesReturnDetail>(`${api}/sales-returns/${id}`);
  }
  returnContext(invoiceId: number) {
    return this.http.get<SalesReturnContext>(`${api}/sales-returns/new-context`, { params: { invoiceId } });
  }
  createReturn(payload: CreateSalesReturnPayload) {
    return this.http.post<SalesReturnDetail>(`${api}/sales-returns`, payload);
  }
}
