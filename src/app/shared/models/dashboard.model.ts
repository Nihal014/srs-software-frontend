export interface DashboardPo {
  id: number;
  po_number: string;
  supplier_name: string;
}

export interface DashboardAwaitingPo extends DashboardPo {
  expected_date: string | null;
  overdue: boolean;
}

export interface DashboardLowStockItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  qty: number;
  reorder_level: number;
}

/** `count` is the true total; `items` is only the first few, for the card. */
export interface AttentionList<T> {
  count: number;
  items: T[];
}

export interface Dashboard {
  isAdmin: boolean;
  attention: {
    pendingApproval: AttentionList<DashboardPo>;
    awaitingReceipt: AttentionList<DashboardAwaitingPo>;
    lowStock: AttentionList<DashboardLowStockItem>;
  };
  production: { todayUnits: number; todayRuns: number; weekUnits: number; weekRuns: number };
  /** Values are null for non-admins. */
  stock: { itemsInStock: number; usableValue: number | null; expiredValue: number | null };
}
