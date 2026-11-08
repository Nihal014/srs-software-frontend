export interface GstCompany {
  legal_name: string;
  gstin: string | null;
  state_code: string | null;
}

/** One document line's GST. Credit notes / debit notes (returns) carry negative amounts. */
export interface GstRow {
  doc_type: 'Invoice' | 'Credit note' | 'Bill' | 'Debit note';
  doc_number: string;
  doc_date: string;
  party_name: string;
  gstin: string | null;
  registered: boolean;
  supply: 'Intra-state' | 'Inter-state';
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
  itc_eligible: boolean;
}

export interface GstRateRow {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
}

export interface GstTotals {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
}

export interface GstSide {
  rows: GstRow[];
  byRate: GstRateRow[];
  totals: GstTotals;
}

export interface GstTaxSplit {
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

export interface GstReport {
  company: GstCompany;
  from: string | null;
  to: string | null;
  sales: GstSide;
  purchases: GstSide;
  summary: {
    output: GstTaxSplit;
    input: GstTaxSplit;
    /** Positive = tax to pay; negative = input credit exceeds output tax. */
    netPayable: number;
    unclaimableInput: number;
  };
}
