// Mirrors PAYMENT_STATUS in the backend's purchase-invoice.interface.ts - keep both in sync.
// Derived from the payments on the server, never stored.
export const PAYMENT_STATUS = {
  Unpaid: 1,
  PartPaid: 2,
  Paid: 3,
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export type PaymentStatusFilter = 'unpaid' | 'part-paid' | 'paid' | 'overdue';

export const PAYMENT_STATUS_FILTER_OPTIONS: { value: PaymentStatusFilter | null; label: string }[] = [
  { value: null, label: 'All invoices' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'part-paid', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.Unpaid]: 'Unpaid',
  [PAYMENT_STATUS.PartPaid]: 'Part paid',
  [PAYMENT_STATUS.Paid]: 'Paid',
};

const STATUS_CHIP: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.Unpaid]: 'status-chip--approved',
  [PAYMENT_STATUS.PartPaid]: 'status-chip--partially-received',
  [PAYMENT_STATUS.Paid]: 'status-chip--fully-received',
};

/** An unpaid or part-paid invoice past its due date reads as Overdue. */
export function paymentStatusLabel(status: PaymentStatus, overdue: boolean | number): string {
  return overdue ? 'Overdue' : STATUS_LABEL[status];
}

export function paymentStatusChip(status: PaymentStatus, overdue: boolean | number): string {
  return overdue ? 'status-chip--cancelled' : STATUS_CHIP[status];
}

export interface PurchaseInvoiceListRow {
  id: number;
  invoice_number: string;
  supplier_invoice_no: string;
  grn_id: number;
  grn_number: string;
  supplier_id: number;
  supplier_name: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  outstanding: number;
  payment_status: PaymentStatus;
  is_overdue: number;
}

export interface PurchaseInvoicePayment {
  id: number;
  payment_date: string;
  amount: number;
  account_id: number;
  account_name: string;
  expense_id: number;
  category_name: string;
  reference: string | null;
  remarks: string | null;
  created_by_name: string | null;
}

export interface PurchaseInvoiceDetail extends PurchaseInvoiceListRow {
  remarks: string | null;
  created_by_name: string | null;
  po_number: string;
  purchase_order_id: number;
  grn_value: number;
  payments: PurchaseInvoicePayment[];
}

export interface InvoiceSummary {
  outstanding: number;
  overdue: number;
  openInvoices: number;
  overdueInvoices: number;
}

export interface InvoiceGrnLine {
  id: number;
  item_code: string;
  item_name: string;
  unit: string;
  qty_accepted: number;
  rate: number;
  tax_percent: number;
  value: number;
}

export interface NewInvoiceContext {
  grn: { id: number; grn_number: string; received_date: string; po_number: string; supplier_id: number; supplier_name: string; payment_terms: string };
  lines: InvoiceGrnLine[];
  grnValue: number;
  alreadyInvoiced: number;
  invoiceCount: number;
  pendingReturnCredit: number;
  termsDays: number;
}

export interface CreatePurchaseInvoicePayload {
  grnId: number;
  supplierInvoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  amount: number;
  remarks?: string;
}

export interface RecordPaymentPayload {
  paymentDate?: string;
  amount: number;
  accountId: number;
  categoryId: number;
  reference?: string;
  remarks?: string;
}
