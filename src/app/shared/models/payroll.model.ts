// Mirrors PAY_TYPE in the backend's payroll.interface.ts — keep both in sync.
export const PAY_TYPE = {
  Hourly: 1,
  Daily: 2,
} as const;

export type PayType = (typeof PAY_TYPE)[keyof typeof PAY_TYPE];

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  [PAY_TYPE.Hourly]: 'Hourly',
  [PAY_TYPE.Daily]: 'Daily',
};

export interface Staff {
  id: number;
  name: string;
  phone: string | null;
  pay_type: PayType;
  pay_rate: number;
  is_active: boolean;
}

export interface UpsertStaffPayload {
  name: string;
  phone?: string;
  payType: PayType;
  payRate: number;
  isActive?: boolean;
}

export interface DayEntryRow {
  staff_id: number;
  name: string;
  pay_type: PayType;
  pay_rate: number;
  entry_id: number | null;
  hours: number | null;
  amount: number | null;
}

export interface DaySheet {
  date: string;
  rows: DayEntryRow[];
  total: number;
  staffCount: number;
}

export interface SaveDayLine {
  staffId: number;
  present: boolean;
  hours?: number;
  amount?: number;
}

export interface MonthSheet {
  month: string;
  daysInMonth: number;
  staff: { staffId: number; name: string; amounts: Record<number, number>; total: number }[];
  dayTotals: Record<number, number>;
  grandTotal: number;
}

export interface YearSheet {
  year: number;
  staff: { staffId: number; name: string; months: number[]; total: number }[];
  monthTotals: number[];
  grandTotal: number;
}

export interface DayTotal {
  date: string;
  total: number;
  staffCount: number;
}
