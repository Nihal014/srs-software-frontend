// Mirrors PRODUCT_WASTAGE_REASON in the backend's product-inventory.interface.ts - keep both in sync.
export const PRODUCT_WASTAGE_REASON = {
  Spoiled: 1,
  Damaged: 2,
  QualityRejected: 3,
  Other: 4,
} as const;
export type ProductWastageReason = (typeof PRODUCT_WASTAGE_REASON)[keyof typeof PRODUCT_WASTAGE_REASON];

export const PRODUCT_WASTAGE_REASON_LABEL: Record<ProductWastageReason, string> = {
  [PRODUCT_WASTAGE_REASON.Spoiled]: 'Spoiled / expired',
  [PRODUCT_WASTAGE_REASON.Damaged]: 'Damaged',
  [PRODUCT_WASTAGE_REASON.QualityRejected]: 'Quality rejected',
  [PRODUCT_WASTAGE_REASON.Other]: 'Other',
};

/** Finished pieces in hand for one product at one location, valued at what the runs cost per piece. */
export interface ProductInventoryRow {
  bundle_product_id: number;
  product_name: string;
  output_unit: string;
  location_id: number;
  location_name: string;
  qty_available: number;
  unit_cost: number;
  stock_value: number;
}

export interface ProductInTransitRow {
  transfer_id: number;
  transfer_number: string;
  product_name: string;
  output_unit: string;
  qty: number;
  from_location_name: string;
  to_location_name: string;
}

export interface ProductStockStatus {
  rows: ProductInventoryRow[];
  inTransit: ProductInTransitRow[];
}

export interface ProductLotRow {
  lot_id: number;
  lot_number: string;
  product_name: string;
  output_unit: string;
  location_name: string;
  production_number: string;
  produced_date: string;
  age_days: number;
  qty_received: number;
  qty_available: number;
  unit_cost: number;
  stock_value: number;
}

export interface ProductAuditLine {
  product_name: string;
  output_unit: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
  difference_value: number;
}

export interface ProductAuditRow {
  id: number;
  audit_number: string;
  audit_date: string;
  location_name: string;
  remarks: string | null;
  created_by_name: string | null;
  lines: ProductAuditLine[];
}

export interface CreateProductAuditPayload {
  locationId: number;
  auditDate?: string;
  remarks?: string;
  lines: { bundleProductId: number; countedQty: number }[];
}

export interface ProductWastageRow {
  id: number;
  wastage_number: string;
  wastage_date: string;
  reason: ProductWastageReason;
  qty: number;
  unit_cost: number;
  value: number;
  remarks: string | null;
  product_name: string;
  output_unit: string;
  location_name: string;
  created_by_name: string | null;
}

export interface CreateProductWastagePayload {
  locationId: number;
  bundleProductId: number;
  qty: number;
  reason: ProductWastageReason;
  wastageDate?: string;
  remarks?: string;
}
