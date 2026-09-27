export interface ItemCategory {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
  /** Items using this category; deleting is blocked while it is above 0. */
  item_count?: number;
}

export interface UpsertItemCategoryPayload {
  name: string;
  code?: string;
  isActive?: boolean;
}
