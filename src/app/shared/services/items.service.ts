import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Item, UpsertItemPayload } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/items`;

  list() {
    return this.http.get<Item[]>(this.base);
  }

  listAll() {
    return this.http.get<Item[]>(this.base, { params: { all: 'true' } });
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
