// Mirrors QUOTATION_STATUS / ORDER_STATUS / SALES_RETURN_REASON in the backend's sales-docs.interface.ts - keep both in sync.
export const QUOTATION_STATUS = { Open: 1, Accepted: 2, Rejected: 3, Converted: 4 } as const;
export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];

export const ORDER_STATUS = { Open: 1, PartiallyDelivered: 2, Delivered: 3, Cancelled: 4 } as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const SALES_RETURN_REASON = { Damaged: 1, WrongItem: 2, QualityComplaint: 3, Unsold: 4, Other: 5 } as const;
export type SalesReturnReason = (typeof SALES_RETURN_REASON)[keyof typeof SALES_RETURN_REASON];

export const SALES_RETURN_REASON_LABEL: Record<SalesReturnReason, string> = {
  [SALES_RETURN_REASON.Damaged]: 'Damaged / spoiled',
  [SALES_RETURN_REASON.WrongItem]: 'Wrong item delivered',
  [SALES_RETURN_REASON.QualityComplaint]: 'Quality complaint',
  [SALES_RETURN_REASON.Unsold]: 'Unsold / returned by the shop',
  [SALES_RETURN_REASON.Other]: 'Other',
};

const QUOTATION_LABEL: Record<QuotationStatus, string> = {
  [QUOTATION_STATUS.Open]: 'Open',
  [QUOTATION_STATUS.Accepted]: 'Accepted',
  [QUOTATION_STATUS.Rejected]: 'Rejected',
  [QUOTATION_STATUS.Converted]: 'Order raised',
};
const QUOTATION_CHIP: Record<QuotationStatus, string> = {
  [QUOTATION_STATUS.Open]: 'status-chip--approved',
  [QUOTATION_STATUS.Accepted]: 'status-chip--fully-received',
  [QUOTATION_STATUS.Rejected]: 'status-chip--cancelled',
  [QUOTATION_STATUS.Converted]: 'status-chip--closed',
};
/** An open quotation past its valid-until date reads as Expired. */
export const quotationLabel = (status: QuotationStatus, expired: boolean | number) => (expired ? 'Expired' : QUOTATION_LABEL[status]);
export const quotationChip = (status: QuotationStatus, expired: boolean | number) => (expired ? 'status-chip--pending' : QUOTATION_CHIP[status]);

const ORDER_LABEL: Record<OrderStatus, string> = {
  [ORDER_STATUS.Open]: 'Open',
  [ORDER_STATUS.PartiallyDelivered]: 'Partially delivered',
  [ORDER_STATUS.Delivered]: 'Delivered',
  [ORDER_STATUS.Cancelled]: 'Cancelled',
};
const ORDER_CHIP: Record<OrderStatus, string> = {
  [ORDER_STATUS.Open]: 'status-chip--approved',
  [ORDER_STATUS.PartiallyDelivered]: 'status-chip--partially-received',
  [ORDER_STATUS.Delivered]: 'status-chip--fully-received',
  [ORDER_STATUS.Cancelled]: 'status-chip--cancelled',
};
export const orderLabel = (status: OrderStatus) => ORDER_LABEL[status];
export const orderChip = (status: OrderStatus) => ORDER_CHIP[status];

export const STATUS_FILTER_QUOTATION: { value: QuotationStatus | null; label: string }[] = [
  { value: null, label: 'All quotations' },
  { value: QUOTATION_STATUS.Open, label: 'Open' },
  { value: QUOTATION_STATUS.Accepted, label: 'Accepted' },
  { value: QUOTATION_STATUS.Rejected, label: 'Rejected' },
  { value: QUOTATION_STATUS.Converted, label: 'Order raised' },
];
export const STATUS_FILTER_ORDER: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'All orders' },
  { value: ORDER_STATUS.Open, label: 'Open' },
  { value: ORDER_STATUS.PartiallyDelivered, label: 'Partially delivered' },
  { value: ORDER_STATUS.Delivered, label: 'Delivered' },
  { value: ORDER_STATUS.Cancelled, label: 'Cancelled' },
];

export interface SalesLocation {
  id: number;
  name: string;
  address: string | null;
  is_active: boolean;
}

export interface UpsertSalesLocationPayload {
  name: string;
  address?: string;
  isActive?: boolean;
}

/** One product line on a quotation, order or invoice, as the server takes it. */
export interface DocLinePayload {
  productId: number;
  qty: number;
  rate: number;
  taxPercent: number;
  discount: number;
}

export interface DocLine {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  unit: string;
  rate: number;
  tax_percent: number;
  discount: number;
  amount: number;
}

// ---- quotations
export interface QuotationListRow {
  id: number;
  quotation_number: string;
  status: QuotationStatus;
  quotation_date: string;
  valid_until: string;
  is_expired: number;
  customer_name: string;
  location_name: string | null;
  total: number;
}

export interface QuotationDetail extends QuotationListRow {
  remarks: string | null;
  customer_id: number;
  payment_terms: string;
  sales_location_id: number | null;
  created_by_name: string | null;
  sales_order_id: number | null;
  order_number: string | null;
  lines: (DocLine & { qty: number })[];
}

export interface CreateQuotationPayload {
  customerId: number;
  salesLocationId?: number | null;
  quotationDate?: string;
  validUntil?: string;
  remarks?: string;
  lines: DocLinePayload[];
}

// ---- sales orders
export interface SalesOrderListRow {
  id: number;
  order_number: string;
  status: OrderStatus;
  order_date: string;
  expected_date: string | null;
  customer_name: string;
  location_name: string | null;
  total: number;
  qty_ordered: number;
  qty_delivered: number;
}

export interface SalesOrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  remarks: string | null;
  customer_id: number;
  customer_name: string;
  payment_terms: string;
  sales_location_id: number | null;
  location_name: string | null;
  quotation_id: number | null;
  quotation_number: string | null;
  order_date: string;
  expected_date: string | null;
  created_by_name: string | null;
  total: number;
  lines: (DocLine & { qty_ordered: number; qty_delivered: number })[];
  deliveryNotes: { id: number; dn_number: string; delivery_date: string; invoice_id: number | null; invoice_number: string | null }[];
}

export interface CreateSalesOrderPayload {
  customerId: number;
  salesLocationId?: number | null;
  orderDate?: string;
  expectedDate?: string;
  remarks?: string;
  lines: DocLinePayload[];
}

// ---- delivery notes
export interface DeliveryNoteListRow {
  id: number;
  dn_number: string;
  delivery_date: string;
  received_by: string | null;
  sales_order_id: number;
  order_number: string;
  customer_name: string;
  invoice_id: number | null;
  invoice_number: string | null;
  qty_delivered: number;
  product_names: string;
}

export interface DeliveryNoteDetail {
  id: number;
  dn_number: string;
  delivery_date: string;
  received_by: string | null;
  vehicle_no: string | null;
  remarks: string | null;
  sales_order_id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  location_name: string | null;
  invoice_id: number | null;
  invoice_number: string | null;
  created_by_name: string | null;
  lines: { id: number; product_id: number; product_code: string; product_name: string; unit: string; qty_delivered: number; qty_ordered: number; rate: number }[];
}

export interface DeliveryNoteContext {
  order: { id: number; order_number: string; status: OrderStatus; customer_name: string; location_name: string | null };
  lines: { order_line_id: number; product_id: number; product_code: string; product_name: string; unit: string; qty_ordered: number; qty_delivered: number; outstanding: number }[];
}

export interface CreateDeliveryNotePayload {
  salesOrderId: number;
  deliveryDate?: string;
  receivedBy?: string;
  vehicleNo?: string;
  remarks?: string;
  lines: { orderLineId: number; qty: number }[];
}

// ---- sales invoices
export interface SalesInvoiceListRow {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  sales_order_id: number | null;
  delivery_note_id: number | null;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  credited_amount: number;
  outstanding: number;
  payment_status: 1 | 2 | 3;
  is_overdue: number;
}

export interface SalesInvoiceDetail extends SalesInvoiceListRow {
  remarks: string | null;
  sales_location_id: number | null;
  location_name: string | null;
  order_number: string | null;
  dn_number: string | null;
  created_by_name: string | null;
  lines: (DocLine & { qty: number; qty_returned: number })[];
  payments: { id: number; payment_date: string; amount: number; account_name: string; reference: string | null; remarks: string | null }[];
  returns: { id: number; return_number: string; return_date: string; total_amount: number }[];
}

export interface InvoiceContext {
  note: {
    id: number;
    dn_number: string;
    delivery_date: string;
    sales_order_id: number;
    order_number: string;
    customer_id: number;
    customer_name: string;
    payment_terms: string;
    sales_location_id: number | null;
  };
  lines: { product_id: number; product_name: string; unit: string; qty: number; rate: number; tax_percent: number; discount: number }[];
  termsDays: number;
}

export interface CreateSalesInvoicePayload {
  customerId: number;
  deliveryNoteId?: number | null;
  salesLocationId?: number | null;
  invoiceDate?: string;
  dueDate?: string;
  remarks?: string;
  lines: DocLinePayload[];
}

export interface RecordSalesPaymentPayload {
  paymentDate?: string;
  amount: number;
  accountId: number;
  reference?: string;
  remarks?: string;
}

// ---- sales returns
export interface SalesReturnListRow {
  id: number;
  return_number: string;
  return_date: string;
  total_amount: number;
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  product_names: string;
}

export interface SalesReturnDetail {
  id: number;
  return_number: string;
  return_date: string;
  total_amount: number;
  remarks: string | null;
  invoice_id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  created_by_name: string | null;
  lines: { id: number; product_id: number; product_code: string; product_name: string; unit: string; qty: number; amount: number; reason: SalesReturnReason }[];
}

export interface SalesReturnContext {
  invoice: { id: number; invoice_number: string; invoice_date: string; customer_id: number; customer_name: string };
  lines: { invoice_line_id: number; product_id: number; product_code: string; product_name: string; unit: string; qty: number; qty_returned: number; returnable: number; amount: number; unit_amount: number }[];
}

export interface CreateSalesReturnPayload {
  invoiceId: number;
  returnDate?: string;
  remarks?: string;
  lines: { invoiceLineId: number; qty: number; reason: SalesReturnReason }[];
}
