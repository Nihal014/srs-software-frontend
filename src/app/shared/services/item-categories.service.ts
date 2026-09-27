import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { ItemCategory, UpsertItemCategoryPayload } from '../models/item-category.model';

@Injectable({ providedIn: 'root' })
export class ItemCategoriesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/item-categories`;

  /** Active categories, for pickers. */
  list() {
    return this.http.get<ItemCategory[]>(this.base);
  }

  /** Every category incl. inactive, for the Master Data screen and for editing an item that uses an inactive one. */
  listAll() {
    return this.http.get<ItemCategory[]>(this.base, { params: { all: 'true' } });
  }

  create(payload: UpsertItemCategoryPayload) {
    return this.http.post<ItemCategory>(this.base, payload);
  }

  update(id: number, payload: UpsertItemCategoryPayload) {
    return this.http.patch<ItemCategory>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
