import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Item, UpsertItemPayload } from '../models/item.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/items`;

  list() {
    return this.http.get<Item[]>(this.base);
  }

  /** Every item incl. inactive, unpaginated — the Bundle Recipes ingredient dropdown needs the whole set. */
  listAll() {
    return this.http.get<Item[]>(this.base, { params: { all: 'true' } });
  }

  /** Paged item list for the Items master screen. */
  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<Item>>(this.base, { params: { all: 'true', page: String(page), pageSize: String(pageSize) } });
  }

  create(payload: UpsertItemPayload) {
    return this.http.post<Item>(this.base, payload);
  }

  update(id: number, payload: UpsertItemPayload) {
    return this.http.patch<Item>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
