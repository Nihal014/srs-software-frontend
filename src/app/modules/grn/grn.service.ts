import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { CreateGrnPayload, GrnContext, GrnDetail, GrnListRow } from 'app/shared/models/grn.model';

@Injectable({ providedIn: 'root' })
export class GrnService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/grns`;

  list() {
    return this.http.get<GrnListRow[]>(this.base);
  }

  get(id: number) {
    return this.http.get<GrnDetail>(`${this.base}/${id}`);
  }

  newContext(poId: number) {
    return this.http.get<GrnContext>(`${this.base}/new-context`, { params: { poId } });
  }

  create(payload: CreateGrnPayload) {
    return this.http.post<GrnDetail>(this.base, payload);
  }
}
