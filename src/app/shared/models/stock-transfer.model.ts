// Mirrors STOCK_TRANSFER_STATUS in the backend's stock-transfer.interface.ts - keep both in sync.
export const STOCK_TRANSFER_STATUS = {
  InTransit: 1,
  Received: 2,
  Cancelled: 3,
} as const;
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUS)[keyof typeof STOCK_TRANSFER_STATUS];

export const STOCK_TRANSFER_STATUS_LABEL: Record<StockTransferStatus, string> = {
  [STOCK_TRANSFER_STATUS.InTransit]: 'In transit',
  [STOCK_TRANSFER_STATUS.Received]: 'Received',
  [STOCK_TRANSFER_STATUS.Cancelled]: 'Cancelled',
};

/** Slug used for the shared status-chip colours. */
export const STOCK_TRANSFER_STATUS_CHIP: Record<StockTransferStatus, string> = {
  [STOCK_TRANSFER_STATUS.InTransit]: 'status-chip--pending',
  [STOCK_TRANSFER_STATUS.Received]: 'status-chip--fully-received',
  [STOCK_TRANSFER_STATUS.Cancelled]: 'status-chip--cancelled',
};

export interface StockTransferListRow {
  id: number;
  transfer_number: string;
  receipt_number: string | null;
  status: StockTransferStatus;
  transfer_date: string;
  received_date: string | null;
  from_location_name: string;
  to_location_name: string;
  item_names: string;
}

export interface StockTransferLine {
  id: number;
  source_batch_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit: string;
  source_batch_number: string;
  expiry_date: string;
  qty_sent: number;
  qty_received: number | null;
  new_batch_id: number | null;
  new_batch_number: string | null;
}

export interface StockTransferDetail {
  id: number;
  transfer_number: string;
  receipt_number: string | null;
  status: StockTransferStatus;
  transfer_date: string;
  received_date: string | null;
  remarks: string | null;
  receive_remarks: string | null;
  from_location_id: number;
  to_location_id: number;
  from_location_name: string;
  to_location_name: string;
  created_by_name: string | null;
  received_by_name: string | null;
  lines: StockTransferLine[];
}

export interface TransferableBatch {
  batch_id: number;
  batch_number: string;
  item_id: number;
  item_code: string;
  item_name: string;
  category_name: string | null;
  unit: string;
  expiry_date: string;
  qty_available: number;
}

export interface StockTransferContext {
  location: { id: number; name: string };
  batches: TransferableBatch[];
}

export interface CreateStockTransferPayload {
  fromLocationId: number;
  toLocationId: number;
  transferDate?: string;
  remarks?: string;
  lines: { batchId: number; qty: number }[];
}

export interface ReceiveStockTransferPayload {
  receivedDate?: string;
  remarks?: string;
  lines: { lineId: number; qtyReceived: number }[];
}
