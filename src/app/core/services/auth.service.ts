import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { USER_ROLE, type CurrentUser, type LoginResponse } from 'app/shared/models/user.model';

const TOKEN_KEY = 'rb_token';

function decodeToken(token: string): CurrentUser | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<CurrentUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === USER_ROLE.Admin);

  private readStoredUser(): CurrentUser | null {
    const token = this.getToken();
    if (!token) return null;
    const user = decodeToken(token);
    if (!user) return null;
    // exp is in seconds since epoch; treat an expired token as logged out.
    const exp = (JSON.parse(atob(token.split('.')[1])) as { exp: number }).exp;
    if (exp * 1000 < Date.now()) {
      this.clearToken();
      return null;
    }
    return user;
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, password });
  }

  signup(name: string, email: string, password: string) {
    return this.http.post(`${this.base}/signup`, { name, email, password });
  }

  setSession(response: LoginResponse) {
    try {
      localStorage.setItem(TOKEN_KEY, response.accessToken);
    } catch {
      /* ignore */
    }
    this.currentUser.set(decodeToken(response.accessToken));
  }

  logout() {
    this.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
