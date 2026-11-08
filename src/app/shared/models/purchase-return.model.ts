// Mirrors PURCHASE_RETURN_REASON / PURCHASE_RETURN_CREDIT in the backend's purchase-return.interface.ts - keep both in sync.
export const PURCHASE_RETURN_REASON = {
  Damaged: 1,
  WrongItem: 2,
  QualityNotAsOrdered: 3,
  Expired: 4,
  ExcessQuantity: 5,
  Other: 6,
} as const;
export type PurchaseReturnReason = (typeof PURCHASE_RETURN_REASON)[keyof typeof PURCHASE_RETURN_REASON];

export const PURCHASE_RETURN_REASON_LABEL: Record<PurchaseReturnReason, string> = {
  [PURCHASE_RETURN_REASON.Damaged]: 'Damaged / spoiled',
  [PURCHASE_RETURN_REASON.WrongItem]: 'Wrong item delivered',
  [PURCHASE_RETURN_REASON.QualityNotAsOrdered]: 'Quality not as ordered',
  [PURCHASE_RETURN_REASON.Expired]: 'Expired / short shelf life',
  [PURCHASE_RETURN_REASON.ExcessQuantity]: 'Excess quantity',
  [PURCHASE_RETURN_REASON.Other]: 'Other',
};

export const PURCHASE_RETURN_CREDIT = {
  Pending: 1,
  Received: 2,
} as const;
export type PurchaseReturnCredit = (typeof PURCHASE_RETURN_CREDIT)[keyof typeof PURCHASE_RETURN_CREDIT];

export const PURCHASE_RETURN_CREDIT_LABEL: Record<PurchaseReturnCredit, string> = {
  [PURCHASE_RETURN_CREDIT.Pending]: 'Credit pending',
  [PURCHASE_RETURN_CREDIT.Received]: 'Credit received',
};

export interface PurchaseReturnListRow {
  id: number;
  return_number: string;
  return_date: string;
  total_amount: number;
  credit_status: PurchaseReturnCredit;
  grn_id: number;
  grn_number: string;
  supplier_name: string;
  item_names: string;
}

export interface PurchaseReturnLine {
  id: number;
  batch_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit: string;
  batch_number: string;
  expiry_date: string;
  qty: number;
  rate: number;
  amount: number;
  reason: PurchaseReturnReason;
  remarks: string | null;
}

export interface PurchaseReturnDetail {
  id: number;
  return_number: string;
  return_date: string;
  total_amount: number;
  credit_status: PurchaseReturnCredit;
  credit_received_date: string | null;
  remarks: string | null;
  created_by_name: string | null;
  grn_id: number;
  grn_number: string;
  purchase_order_id: number;
  po_number: string;
  supplier_name: string;
  lines: PurchaseReturnLine[];
}

export interface ReturnableBatch {
  batch_id: number;
  batch_number: string;
  item_id: number;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit: string;
  expiry_date: string;
  qty_received: number;
  qty_available: number;
  rate: number;
}

export interface PurchaseReturnContext {
  grn: { id: number; grn_number: string; received_date: string; po_number: string; supplier_id: number; supplier_name: string };
  batches: ReturnableBatch[];
}

export interface CreatePurchaseReturnPayload {
  grnId: number;
  returnDate?: string;
  remarks?: string;
  lines: { batchId: number; qty: number; reason: PurchaseReturnReason; remarks?: string }[];
}
