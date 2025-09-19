// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from 'src/app/models/product';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.API_BASE;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`, { headers: this.getHeaders() });
  }

  createProduct(product: Product | FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product, { headers: this.getHeaders() });
  }

  updateProductQuantity(id: number, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}/quantity?quantity=${quantity}`, {}, { headers: this.getHeaders() });
  }

  addToCart(productId: number, grams?: number): Observable<any> {
    const params: any = { productId };
    if (grams && grams > 0) params.grams = grams;
    return this.http.post(`${this.apiUrl}/cart`, null, { headers: this.getHeaders(), params });
  }
}
