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
}
