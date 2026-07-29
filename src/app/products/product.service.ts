import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(name?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<any>(`${environment.apiUrl}/products`, { params }).pipe(
      map((response) => {
        return response.content ?? response;
      })
    );
  }

  // Admin: POST /api/products
  addProduct(data: { name: string; price: number; stockQuantity: number; description?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/products`, data);
  }

  // Admin: PUT /api/products/:id
  updateProduct(id: number, data: { name: string; price: number; stockQuantity: number; description?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/products/${id}`, data);
  }

  // Admin: DELETE /api/products/:id  (soft delete)
  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/products/${id}`);
  }
}
