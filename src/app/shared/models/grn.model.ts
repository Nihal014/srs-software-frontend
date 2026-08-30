import type { PoStatus } from './purchase-order.model';

export interface GrnListRow {
  id: number;
  grn_number: string;
  received_date: string;
  po_number: string;
  purchase_order_id: number;
  supplier_name: string;
  qty_received: number;
  qty_accepted: number;
  qty_rejected: number;
  batch_numbers: string;
}

export interface GrnContextLine {
  purchase_order_line_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  qty_ordered: number;
  rate: number;
  prior_received: number;
  outstanding: number;
  suggested: {
    qtyReceived: number;
    qtyAccepted: number;
    qtyRejected: number;
    mfgDate: string;
    expiryDate: string;
  };
}

export interface GrnContext {
  po: {
    id: number;
    po_number: string;
    status: PoStatus;
    supplier_name: string;
  };
  lines: GrnContextLine[];
}

export interface GrnLinePayload {
  purchaseOrderLineId: number;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  rejectionReason?: string;
  batchNumber?: string;
  mfgDate: string;
  expiryDate: string;
}

export interface CreateGrnPayload {
  poId: number;
  receivedDate?: string;
  remarks?: string;
  lines: GrnLinePayload[];
}

export interface GrnDetail {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  po_number: string;
  supplier_name: string;
  received_date: string;
  lines: Array<{
    id: number;
    item_id: number;
    item_name: string;
    unit: string;
    purchase_order_line_id: number;
    qty_received: number;
    qty_accepted: number;
    qty_rejected: number;
    rejection_reason: string | null;
    batch_number: string;
    mfg_date: string;
    expiry_date: string;
  }>;
}
