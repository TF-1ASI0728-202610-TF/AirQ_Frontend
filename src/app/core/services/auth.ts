import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { RegisterUserRequest } from '../models/register-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, request)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          const role = response.role ?? this.getRoleFromToken();
          if (role) {
            localStorage.setItem('role', role);
          }
        })
      );
  }

  register(request: RegisterUserRequest) {
    return this.http.post(`${environment.apiUrl}/users`, request);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  getRole(): string | null {
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      return storedRole;
    }

    return this.getRoleFromToken();
  }

  getRoleFromToken(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized));
      return decoded.role ?? null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getRole()?.toUpperCase() === 'ADMIN';
  }

  isClient(): boolean {
    return this.getRole()?.toUpperCase() === 'CLIENT';
  }
}