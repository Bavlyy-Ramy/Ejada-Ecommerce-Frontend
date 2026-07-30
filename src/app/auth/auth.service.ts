import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((response) => {
          const token = response.token || response.accessToken || response.jwt;
          if (token) {
            localStorage.setItem(TOKEN_KEY, token);
          }
          const role = response.role || response.user?.role || response.roleName;
          if (role) {
            localStorage.setItem('user_role', typeof role === 'string' ? role : JSON.stringify(role));
          }
          const displayName =
            response.firstName ||
            response.name ||
            response.user?.firstName ||
            response.username ||
            response.user?.username ||
            username;
          if (displayName) {
            localStorage.setItem('user_name', displayName);
          }
          localStorage.setItem('username', username);
        })
      );
  }

  register(data: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Observable<any> {
    // Every customer that signs up through this form gets the "USER" role.
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, {
      ...data,
      role: 'USER'
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('username');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserName(): string | null {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      return storedName;
    }
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      return storedUsername;
    }
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      let payload: any = null;
      try {
        payload = JSON.parse(atob(base64));
      } catch {
        try {
          payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
        } catch {}
      }

      if (!payload) return null;
      return payload.firstName || payload.name || payload.username || payload.sub || payload.preferred_username || null;
    } catch {
      return null;
    }
  }

  private normalizeRole(role: any): string | null {
    if (!role) return null;
    if (Array.isArray(role) && role.length > 0) role = role[0];
    if (typeof role === 'object' && role !== null) {
      role = role.authority || role.role || role.name || role.roleName || String(role);
    }
    if (typeof role !== 'string') return null;

    let clean = role.toUpperCase().trim();
    if (clean.startsWith('ROLE_')) {
      clean = clean.substring(5);
    }
    clean = clean.replace(/_/g, ''); 
    return clean;
  }

  // Decodes the JWT and returns the user's role ('USER', 'ADMIN', 'SUPERADMIN')
  getRoleFromToken(): string | null {
    // 1. Check if role was saved during login
    const storedRole = localStorage.getItem('user_role');
    if (storedRole) {
      const normalized = this.normalizeRole(storedRole);
      if (normalized) return normalized;
    }

    // 2. Fallback to decoding JWT token payload
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      let payload: any = null;
      try {
        payload = JSON.parse(atob(base64));
      } catch {
        try {
          payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
        } catch {}
      }

      if (!payload) return null;

      const rawRole =
        payload.role ||
        payload.roles ||
        payload.authorities ||
        payload.auth ||
        payload.type ||
        payload.userRole;

      const norm = this.normalizeRole(rawRole);
      if (norm) return norm;

      // Fallback: search payload JSON string for ADMIN / SUPERADMIN
      const payloadStr = JSON.stringify(payload).toUpperCase();
      if (payloadStr.includes('SUPERADMIN') || payloadStr.includes('SUPER_ADMIN')) {
        return 'SUPERADMIN';
      }
      if (payloadStr.includes('ADMIN')) {
        return 'ADMIN';
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  isSuperAdmin(): boolean {
    return this.getRoleFromToken() === 'SUPERADMIN';
  }
}


