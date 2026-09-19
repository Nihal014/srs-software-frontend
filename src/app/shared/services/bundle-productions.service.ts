import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  BundleProductionDetail,
  BundleProductionRow,
  CreateProductionPayload,
  RequirementLine,
} from '../models/bundle.model';

@Injectable({ providedIn: 'root' })
export class BundleProductionsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/bundle-productions`;

  list() {
    return this.http.get<BundleProductionRow[]>(this.base);
  }

  findOne(id: number) {
    return this.http.get<BundleProductionDetail>(`${this.base}/${id}`);
  }

  checkRequirement(bundleProductId: number, qty: number) {
    return this.http.get<RequirementLine[]>(`${this.base}/requirement`, {
      params: { bundleProductId, qty },
    });
  }

  create(payload: CreateProductionPayload) {
    return this.http.post<BundleProductionDetail>(this.base, payload);
  }
}
