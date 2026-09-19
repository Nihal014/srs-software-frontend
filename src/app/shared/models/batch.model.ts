export interface Batch {
  id: number;
  batch_number: string;
  item_id: number;
  item_name: string;
  unit: string;
  grn_line_id: number;
  grn_id: number;
  grn_number: string;
  purchase_order_id: number;
  po_number: string;
  qty_received: number;
  qty_consumed: number;
  qty_adjusted: number;
  qty_available: number;
  mfg_date: string;
  expiry_date: string;
  is_quarantined: boolean;
  days_to_expiry: number;
  created_at: string;
}

export interface StockSummaryRow {
  item_id: number;
  item_name: string;
  unit: string;
  totalQtyAvailable: number;
  batchCount: number;
  nearestExpiryDays: number | null;
}

// CSS-safe slug for the expiry-status chip, mirroring the PO_STATUS_SLUG convention.
export function expiryStatusSlug(daysToExpiry: number, isQuarantined: boolean): string {
  if (isQuarantined) return 'rejected';
  if (daysToExpiry < 0) return 'cancelled';
  if (daysToExpiry <= 7) return 'pending-approval';
  return 'active';
}

export function expiryStatusLabel(daysToExpiry: number, isQuarantined: boolean): string {
  if (isQuarantined) return 'Quarantined';
  if (daysToExpiry < 0) return 'Expired';
  if (daysToExpiry <= 7) return `Expires in ${daysToExpiry}d`;
  return 'Good';
}
