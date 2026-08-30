export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  pan: string | null;
  payment_terms: string;
  is_active: boolean;
}

export interface UpsertSupplierPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  paymentTerms?: string;
  isActive?: boolean;
}
