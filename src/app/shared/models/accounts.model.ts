// Numeric codes mirror src/accounts/accounts.interface.ts in the backend — keep both in sync.
export const PL_GROUP = { DirectCost: 1, OtherExpense: 2, Capital: 3 } as const;
export type PlGroup = (typeof PL_GROUP)[keyof typeof PL_GROUP];
export const PL_GROUP_LABEL: Record<PlGroup, string> = {
  [PL_GROUP.DirectCost]: 'Direct cost',
  [PL_GROUP.OtherExpense]: 'Other expense',
  [PL_GROUP.Capital]: 'Capital (not in profit)',
};

export const ACCOUNT_TYPE = { Bank: 1, Cash: 2, Partner: 3 } as const;
export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  [ACCOUNT_TYPE.Bank]: 'Bank',
  [ACCOUNT_TYPE.Cash]: 'Cash',
  [ACCOUNT_TYPE.Partner]: 'Partner',
};

export const RECEIPT_SOURCE = { Capital: 1, SalesPayment: 2, CashTransfer: 3, Other: 4 } as const;
export type ReceiptSource = (typeof RECEIPT_SOURCE)[keyof typeof RECEIPT_SOURCE];
export const RECEIPT_SOURCE_LABEL: Record<ReceiptSource, string> = {
  [RECEIPT_SOURCE.Capital]: 'Capital investment',
  [RECEIPT_SOURCE.SalesPayment]: 'Customer payment',
  [RECEIPT_SOURCE.CashTransfer]: 'Cash deposit / transfer',
  [RECEIPT_SOURCE.Other]: 'Other',
};

export const BILL_STATUS = { Available: 1, PaymentReceipt: 2, NotAvailable: 3 } as const;
export type BillStatus = (typeof BILL_STATUS)[keyof typeof BILL_STATUS];
export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  [BILL_STATUS.Available]: 'Bill available',
  [BILL_STATUS.PaymentReceipt]: 'Payment receipt',
  [BILL_STATUS.NotAvailable]: 'Not available',
};

export interface ExpenseCategory {
  id: number;
  name: string;
  pl_group: PlGroup;
  is_active: boolean;
}

export interface Account {
  id: number;
  name: string;
  account_type: AccountType;
  opening_balance: number;
  is_active: boolean;
  balance: number;
}

export interface Paged<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  sum: number;
}

export interface ListFilters {
  from?: string;
  to?: string;
  search?: string;
  categoryId?: number | null;
  accountId?: number | null;
  page?: number;
  pageSize?: number;
}

export interface Expense {
  id: number;
  expense_date: string;
  description: string;
  category_id: number;
  category_name: string;
  pl_group: PlGroup;
  qty: number;
  amount: number;
  account_id: number;
  account_name: string;
  bill_status: BillStatus;
  remarks: string | null;
}

export interface ExpensePayload {
  expenseDate: string;
  description: string;
  categoryId: number;
  qty: number;
  amount: number;
  accountId: number;
  billStatus: BillStatus;
  remarks?: string;
}

export interface Receipt {
  id: number;
  receipt_date: string;
  source: ReceiptSource;
  description: string;
  amount: number;
  account_id: number;
  account_name: string;
  remarks: string | null;
}

export interface ReceiptPayload {
  receiptDate: string;
  source: ReceiptSource;
  description: string;
  amount: number;
  accountId: number;
  remarks?: string;
}

export interface Sale {
  id: number;
  sale_date: string;
  customer: string | null;
  description: string;
  amount: number;
  remarks: string | null;
}

export interface SalePayload {
  saleDate: string;
  customer?: string;
  description: string;
  amount: number;
  remarks?: string;
}

export interface ReadyProducts {
  id: number;
  as_of_date: string;
  amount: number;
  remarks: string | null;
}

export interface CashBookEntry {
  kind: 'R' | 'E';
  id: number;
  date: string;
  description: string;
  category: string;
  account: string;
  moneyIn: number;
  moneyOut: number;
  balance: number;
}

export interface CashBook {
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  entries: CashBookEntry[];
}

export interface PlLine {
  categoryId: number;
  name: string;
  total: number;
}

export interface ProfitLoss {
  from: string | null;
  to: string | null;
  sales: number;
  readyProducts: { amount: number; asOf: string | null };
  revenue: number;
  directCosts: { lines: PlLine[]; total: number };
  grossMargin: number;
  grossMarginPct: number | null;
  otherExpenses: { lines: PlLine[]; total: number };
  netMargin: number;
  netMarginPct: number | null;
  capital: { lines: PlLine[]; total: number };
}

export interface AccountsSummary {
  asOf: string;
  capitalInvestment: number;
  allExpenses: number;
  totalSales: number;
  grossProfit: number;
  grossProfitPct: number | null;
  netProfit: number;
  netProfitPct: number | null;
  dueReceivable: number;
  readyProducts: { amount: number; asOf: string | null };
  balances: { id: number; name: string; accountType: AccountType; balance: number }[];
  companyTotal: number;
  thisMonth: { label: string; sales: number; expenses: number; paymentsReceived: number };
}
