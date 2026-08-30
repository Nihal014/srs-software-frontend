// Mirrors PO_STATUS in the backend's po.interface.ts — keep both in sync.
export const PO_STATUS = {
  Draft: 1,
  PendingApproval: 2,
  Approved: 3,
  SentToSupplier: 4,
  PartiallyReceived: 5,
  FullyReceived: 6,
  Closed: 7,
  Cancelled: 8,
} as const;

export type PoStatus = (typeof PO_STATUS)[keyof typeof PO_STATUS];

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  [PO_STATUS.Draft]: 'Draft',
  [PO_STATUS.PendingApproval]: 'Pending Approval',
  [PO_STATUS.Approved]: 'Approved',
  [PO_STATUS.SentToSupplier]: 'Sent to Supplier',
  [PO_STATUS.PartiallyReceived]: 'Partially Received',
  [PO_STATUS.FullyReceived]: 'Fully Received',
  [PO_STATUS.Closed]: 'Closed',
  [PO_STATUS.Cancelled]: 'Cancelled',
};

// CSS-safe slug per status, used only for chip class names.
export const PO_STATUS_SLUG: Record<PoStatus, string> = {
  [PO_STATUS.Draft]: 'draft',
  [PO_STATUS.PendingApproval]: 'pending-approval',
  [PO_STATUS.Approved]: 'approved',
  [PO_STATUS.SentToSupplier]: 'sent-to-supplier',
  [PO_STATUS.PartiallyReceived]: 'partially-received',
  [PO_STATUS.FullyReceived]: 'fully-received',
  [PO_STATUS.Closed]: 'closed',
  [PO_STATUS.Cancelled]: 'cancelled',
};

export interface PoListRow {
  id: number;
  po_number: string;
  status: PoStatus;
  expected_date: string | null;
  created_at: string;
  supplier_id: number;
  supplier_name: string;
  qty_ordered: number;
  qty_received: number;
  qtyOutstanding: number;
  value: number;
}

export interface PoLine {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  qty_ordered: number;
  rate: number;
  tax_percent: number;
  discount: number;
  qty_received: number;
  outstanding: number;
  lineTotal: number;
}

export interface PoLinkedGrn {
  id: number;
  grn_number: string;
  received_date: string;
  qty_received: number;
  qty_accepted: number;
  qty_rejected: number;
  batch_numbers: string;
}

export interface PurchaseOrderDetail {
  id: number;
  po_number: string;
  status: PoStatus;
  supplier_id: number;
  supplier_name: string;
  delivery_location: string;
  expected_date: string | null;
  payment_terms: string;
  remarks: string | null;
  created_at: string;
  lines: PoLine[];
  totals: { subtotal: number; discount: number; tax: number; grandTotal: number };
  grns: PoLinkedGrn[];
}

export interface PoLinePayload {
  itemId: number;
  qtyOrdered: number;
  rate: number;
  taxPercent: number;
  discount: number;
}

export interface CreatePoPayload {
  supplierId: number;
  deliveryLocation?: string;
  expectedDate?: string;
  paymentTerms?: string;
  remarks?: string;
  lines: PoLinePayload[];
}
