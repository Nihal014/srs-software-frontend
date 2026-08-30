export interface DeliveryLocation {
  id: number;
  name: string;
  is_active: boolean;
}

export interface UpsertDeliveryLocationPayload {
  name: string;
  isActive?: boolean;
}
