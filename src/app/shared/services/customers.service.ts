import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Customer, UpsertCustomerPayload } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/customers`;

  /** Active customers only, for pickers. */
  list() {
    return this.http.get<Customer[]>(this.base);
  }

  listAll() {
    return this.http.get<Customer[]>(this.base, { params: { all: 'true' } });
  }

  create(payload: UpsertCustomerPayload) {
    return this.http.post<Customer>(this.base, payload);
  }

  update(id: number, payload: UpsertCustomerPayload) {
    return this.http.patch<Customer>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
