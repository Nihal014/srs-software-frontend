import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { GstCompany, GstReport } from '../models/gst-report.model';

@Injectable({ providedIn: 'root' })
export class GstReportsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gst-reports`;

  report(from?: string, to?: string) {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<GstReport>(this.base, { params });
  }

  updateCompany(payload: { legalName: string; gstin: string }) {
    return this.http.put<GstCompany>(`${this.base}/company`, payload);
  }
}
