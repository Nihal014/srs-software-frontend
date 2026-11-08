export interface Customer {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  payment_terms: string;
  credit_limit: number | null;
  is_active: boolean;
  /** Derived on the server from sales and linked customer payments. */
  total_sales: number;
  total_received: number;
  outstanding: number;
  over_limit: boolean;
}

export interface UpsertCustomerPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}
