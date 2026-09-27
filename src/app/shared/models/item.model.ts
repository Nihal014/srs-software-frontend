export interface Item {
  id: number;
  code: string;
  name: string;
  unit: string;
  category_id: number | null;
  category_name: string | null;
  category_code: string | null;
  rate: number;
  reorder_level: number;
  is_active: boolean;
}

export interface UpsertItemPayload {
  code: string;
  name: string;
  unit: string;
  /** null clears the category; leave it out to keep the current one. */
  categoryId?: number | null;
  rate?: number;
  reorderLevel: number;
  isActive?: boolean;
}
