import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { DeliveryLocation, UpsertDeliveryLocationPayload } from '../models/delivery-location.model';

@Injectable({ providedIn: 'root' })
export class DeliveryLocationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/delivery-locations`;

  list() {
    return this.http.get<DeliveryLocation[]>(this.base);
  }

  listAll() {
    return this.http.get<DeliveryLocation[]>(this.base, { params: { all: 'true' } });
  }

  create(payload: UpsertDeliveryLocationPayload) {
    return this.http.post<DeliveryLocation>(this.base, payload);
  }

  update(id: number, payload: UpsertDeliveryLocationPayload) {
    return this.http.patch<DeliveryLocation>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
