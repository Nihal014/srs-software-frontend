export interface Item {
  id: number;
  code: string;
  name: string;
  unit: string;
  rate: number;
  reorder_level: number;
  is_active: boolean;
}

export interface UpsertItemPayload {
  code: string;
  name: string;
  unit: string;
  rate?: number;
  reorderLevel: number;
  isActive?: boolean;
}
