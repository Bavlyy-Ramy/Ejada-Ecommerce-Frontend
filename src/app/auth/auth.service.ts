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
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
