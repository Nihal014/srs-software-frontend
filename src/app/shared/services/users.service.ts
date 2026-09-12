import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { ManagedUser, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  list() {
    return this.http.get<ManagedUser[]>(this.base);
  }

  approve(id: number, role?: UserRole) {
    return this.http.post<ManagedUser>(`${this.base}/${id}/approve`, { role });
  }

  reject(id: number) {
    return this.http.post<ManagedUser>(`${this.base}/${id}/reject`, {});
  }

  updateRole(id: number, role: UserRole) {
    return this.http.patch<ManagedUser>(`${this.base}/${id}`, { role });
  }

  setActive(id: number, isActive: boolean) {
    return this.http.patch<ManagedUser>(`${this.base}/${id}`, { isActive });
  }
}
