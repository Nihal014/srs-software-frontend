export interface BundleProduct {
  id: number;
  code: string;
  name: string;
  output_unit: string;
  selling_price: number;
  is_active: boolean;
}

export interface BundleBomLine {
  id: number;
  bundle_product_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  qty_per_unit: number;
}

export interface BundleProductDetail extends BundleProduct {
  bomLines: BundleBomLine[];
}

export interface BomLinePayload {
  itemId: number;
  qtyPerUnit: number;
}

export interface UpsertBundleProductPayload {
  code: string;
  name: string;
  outputUnit: string;
  sellingPrice: number;
  isActive?: boolean;
  bomLines: BomLinePayload[];
}

export interface RequirementLine {
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  required: number;
  available: number;
  /** Already-expired stock of this item, not counted in `available`. */
  expired?: number;
  shortage: number;
}

export interface BundleConsumption {
  id: number;
  production_id: number;
  batch_id: number;
  item_id: number;
  item_name: string;
  batch_number: string;
  qty_consumed: number;
  rate_at_time: number;
  cost: number;
  grn_id: number;
  grn_number: string;
  purchase_order_id: number;
  po_number: string;
  supplier_name: string;
}

export interface BundleProductionRow {
  id: number;
  production_number: string;
  bundle_product_id: number;
  bundle_code: string;
  bundle_name: string;
  qty_produced: number;
  produced_date: string;
  material_cost: number;
  labor_cost_per_unit: number;
  /** 1 when labour was shared from the day's payroll (updates as more runs are added that day). */
  labor_from_payroll: boolean;
  overhead_cost_per_unit: number;
  unit_cost: number;
  selling_price: number;
  shortage_override: boolean;
  created_by: number | null;
  created_at: string;
}

export interface BundleProductionDetail extends BundleProductionRow {
  output_unit: string;
  consumptions: BundleConsumption[];
}

export interface CreateProductionPayload {
  bundleProductId: number;
  qtyProduced: number;
  producedDate?: string;
  laborCostPerUnit?: number;
  /** Admin only: share that day's payroll across the day's payroll-based runs. */
  laborFromPayroll?: boolean;
  overheadCostPerUnit?: number;
  sellingPrice?: number;
  override?: boolean;
}

/** One row of the Bundling landing list — a date that has production. `wages` is Admin only. */
export interface BundleProductionDay {
  date: string;
  runs: number;
  units: number;
  payroll_runs: number;
  wages?: number;
}

/** A single date's runs plus its payroll picture; `wages` is null for non-admins. */
export interface BundleProductionDayDetail {
  date: string;
  runs: (BundleProductionRow & { output_unit: string })[];
  totalUnits: number;
  /** Units in the runs whose labour is shared from payroll. */
  payrollUnits: number;
  wages: number | null;
  staffCount: number;
}
