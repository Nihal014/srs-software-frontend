import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { BundleProduct, BundleProductDetail, UpsertBundleProductPayload } from '../models/bundle.model';

@Injectable({ providedIn: 'root' })
export class BundleProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/bundle-products`;

  list() {
    return this.http.get<BundleProduct[]>(this.base);
  }

  listAll() {
    return this.http.get<BundleProduct[]>(this.base, { params: { all: 'true' } });
  }

  findOne(id: number) {
    return this.http.get<BundleProductDetail>(`${this.base}/${id}`);
  }

  create(payload: UpsertBundleProductPayload) {
    return this.http.post<BundleProductDetail>(this.base, payload);
  }

  update(id: number, payload: UpsertBundleProductPayload) {
    return this.http.patch<BundleProductDetail>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
