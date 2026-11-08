// Mirrors PRODUCT_TRANSFER_STATUS in the backend's product-transfer.interface.ts - keep both in sync.
export const PRODUCT_TRANSFER_STATUS = {
  InTransit: 1,
  Received: 2,
  Cancelled: 3,
} as const;
export type ProductTransferStatus = (typeof PRODUCT_TRANSFER_STATUS)[keyof typeof PRODUCT_TRANSFER_STATUS];

export const PRODUCT_TRANSFER_STATUS_LABEL: Record<ProductTransferStatus, string> = {
  [PRODUCT_TRANSFER_STATUS.InTransit]: 'In transit',
  [PRODUCT_TRANSFER_STATUS.Received]: 'Received',
  [PRODUCT_TRANSFER_STATUS.Cancelled]: 'Cancelled',
};

/** Slug used for the shared status-chip colours. */
export const PRODUCT_TRANSFER_STATUS_CHIP: Record<ProductTransferStatus, string> = {
  [PRODUCT_TRANSFER_STATUS.InTransit]: 'status-chip--pending',
  [PRODUCT_TRANSFER_STATUS.Received]: 'status-chip--fully-received',
  [PRODUCT_TRANSFER_STATUS.Cancelled]: 'status-chip--cancelled',
};

export interface ProductTransferListRow {
  id: number;
  transfer_number: string;
  receipt_number: string | null;
  status: ProductTransferStatus;
  transfer_date: string;
  received_date: string | null;
  from_location_name: string;
  to_location_name: string;
  product_names: string;
}

export interface ProductTransferLine {
  id: number;
  source_lot_id: number;
  bundle_product_id: number;
  product_code: string;
  product_name: string;
  output_unit: string;
  source_lot_number: string;
  production_id: number;
  production_number: string;
  qty_sent: number;
  qty_received: number | null;
  new_lot_id: number | null;
  new_lot_number: string | null;
}

export interface ProductTransferDetail {
  id: number;
  transfer_number: string;
  receipt_number: string | null;
  status: ProductTransferStatus;
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
  lines: ProductTransferLine[];
}

/** A lot of finished pieces (one production run's output, or the part of it that moved) that can be sent. */
export interface TransferableLot {
  lot_id: number;
  lot_number: string;
  bundle_product_id: number;
  product_code: string;
  product_name: string;
  output_unit: string;
  production_number: string;
  produced_date: string;
  qty_available: number;
}

export interface ProductTransferContext {
  location: { id: number; name: string };
  lots: TransferableLot[];
}

/** Finished pieces in hand for one product at one location. */
export interface ProductStockRow {
  bundle_product_id: number;
  product_name: string;
  output_unit: string;
  location_id: number;
  location_name: string;
  qty_available: number;
}

export interface CreateProductTransferPayload {
  fromLocationId: number;
  toLocationId: number;
  transferDate?: string;
  remarks?: string;
  lines: { lotId: number; qty: number }[];
}

export interface ReceiveProductTransferPayload {
  receivedDate?: string;
  remarks?: string;
  lines: { lineId: number; qtyReceived: number }[];
}
