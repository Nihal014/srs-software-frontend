export interface DeliveryLocation {
  id: number;
  name: string;
  is_active: boolean;
  /** Bundling takes ingredient stock from production sites. */
  is_production: boolean;
}

export interface UpsertDeliveryLocationPayload {
  name: string;
  isActive?: boolean;
  isProduction?: boolean;
}
