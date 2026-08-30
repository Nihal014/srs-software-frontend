import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Supplier, UpsertSupplierPayload } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/suppliers`;

  list() {
    return this.http.get<Supplier[]>(this.base);
  }

  listAll() {
    return this.http.get<Supplier[]>(this.base, { params: { all: 'true' } });
  }

  create(payload: UpsertSupplierPayload) {
    return this.http.post<Supplier>(this.base, payload);
  }

  update(id: number, payload: UpsertSupplierPayload) {
    return this.http.patch<Supplier>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
