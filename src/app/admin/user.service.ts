import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  // GET /api/users
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users`);
  }

  // GET /api/users/:id
  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/${id}`);
  }

  // POST /api/users/customer
  createCustomer(data: { username: string; email: string; password: string; firstName: string; lastName: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/customer`, data);
  }

  // POST /api/users/admin
  createAdmin(data: { username: string; email: string; password: string; firstName: string; lastName: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/admin`, data);
  }

  // PUT /api/users/:id
  updateUser(id: number, data: { username: string; email: string; firstName: string; lastName: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/users/${id}`, data);
  }

  // PUT /api/users/deactivate/:id
  deactivateUser(id: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/users/deactivate/${id}`, {});
  }
}
