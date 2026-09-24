import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  BundleProductionDay,
  BundleProductionDayDetail,
  BundleProductionDetail,
  BundleProductionRow,
  CreateProductionPayload,
  RequirementLine,
} from '../models/bundle.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class BundleProductionsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/bundle-productions`;

  list() {
    return this.http.get<BundleProductionRow[]>(this.base);
  }

  /** Paged production list for the Bundling screen. */
  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<BundleProductionRow>>(this.base, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  /** Landing list: one row per date that has production. */
  listDays(page: number, pageSize: number) {
    return this.http.get<Paged<BundleProductionDay>>(`${this.base}/days`, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  getDay(date: string) {
    return this.http.get<BundleProductionDayDetail>(`${this.base}/day`, { params: { date } });
  }

  /** Admin: re-share the day's payroll across its payroll-based runs. */
  recalculateLabor(date: string) {
    return this.http.post<{ wages: number; units: number; laborPerUnit: number; runs: number }>(`${this.base}/recalculate-labor`, { date });
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
