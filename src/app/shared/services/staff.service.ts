import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Staff, UpsertStaffPayload } from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/staff`;

  listAll() {
    return this.http.get<Staff[]>(this.base, { params: { all: 'true' } });
  }

  create(payload: UpsertStaffPayload) {
    return this.http.post<Staff>(this.base, payload);
  }

  update(id: number, payload: UpsertStaffPayload) {
    return this.http.patch<Staff>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
