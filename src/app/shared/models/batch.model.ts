export interface Batch {
  id: number;
  batch_number: string;
  item_id: number;
  item_name: string;
  unit: string;
  item_rate: number;
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

// Numeric code convention, mirrored by hand in the backend (batch.interface.ts).
export const BATCH_ADJUSTMENT_REASON = { Expired: 1, Damaged: 2, CountCorrection: 3, Other: 4 } as const;
export type BatchAdjustmentReason = (typeof BATCH_ADJUSTMENT_REASON)[keyof typeof BATCH_ADJUSTMENT_REASON];
export const BATCH_ADJUSTMENT_REASON_LABEL: Record<BatchAdjustmentReason, string> = {
  [BATCH_ADJUSTMENT_REASON.Expired]: 'Expired',
  [BATCH_ADJUSTMENT_REASON.Damaged]: 'Damaged / spoiled',
  [BATCH_ADJUSTMENT_REASON.CountCorrection]: 'Stock count correction',
  [BATCH_ADJUSTMENT_REASON.Other]: 'Other',
};

export interface BatchAdjustment {
  id: number;
  batch_id: number;
  qty: number;
  reason: BatchAdjustmentReason;
  remarks: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface AdjustBatchPayload {
  qty: number;
  reason: BatchAdjustmentReason;
  remarks?: string;
}

export interface StockSummaryRow {
  item_id: number;
  item_name: string;
  unit: string;
  /** Stock in unexpired batches — the only stock that can be used. */
  usableQty: number;
  /** Stock left in batches already past their expiry date. */
  expiredQty: number;
  /** Unexpired batches only. */
  batchCount: number;
  /** Days to the soonest-expiring unexpired batch; null when nothing usable is left. */
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
