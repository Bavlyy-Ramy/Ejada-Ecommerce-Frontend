import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface MyOrderFilters {
  status?: string;  //PENDING, SHIPPED, DELIVERED, CANCELLED
  page?: number;
  size?: number;
}

// Filters available for the admin "all orders" endpoint
export interface AdminOrderFilters {
  status?: string;
  username?: string;
  userId?: number;
  from?: string;   
  to?: string;     
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(items: OrderItem[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders`, { items });
  }

  getMyOrders(filters: MyOrderFilters = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.size !== undefined) params = params.set('size', filters.size);
    return this.http.get<any>(`${environment.apiUrl}/orders/my`, { params });
  }

  getAllOrders(filters: AdminOrderFilters = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.status)   params = params.set('status',   filters.status);
    if (filters.username) params = params.set('username', filters.username);
    if (filters.userId !== undefined) params = params.set('userId', filters.userId);
    if (filters.from)     params = params.set('from',     filters.from);
    if (filters.to)       params = params.set('to',       filters.to);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.size !== undefined) params = params.set('size', filters.size);
    return this.http.get<any>(`${environment.apiUrl}/orders`, { params });
  }

  // Admin: PUT /api/orders/:id/status
  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/orders/${id}/status`, { status });
  }
}
