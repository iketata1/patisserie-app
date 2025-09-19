// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from 'src/app/models/product';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = environment.API_BASE;
  public cartChanged = new Subject<void>();
  private cartItemCount = 0; // si items=grammes, compte total grammes

  constructor(private http: HttpClient, private auth: AuthService) { this.updateItemCount(); }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  private updateItemCount(): void {
    if (!this.auth.isAuthenticated()) { this.cartItemCount = 0; return; }
    this.getCart().subscribe({
      next: cart => {
        this.cartItemCount = Object.values(cart.items).reduce((sum: any, v: any) => sum + Number(v || 0), 0);
      },
      error: _ => { this.cartItemCount = 0; }
    });
  }

  getCart(): Observable<{ items: { [key: number]: number }, total: number }> {
    return this.http.get<{ items: { [key: number]: number }, total: number }>(
      `${this.apiUrl}/cart`, { headers: this.getAuthHeaders() }
    );
  }

  addToCart(productId: number, grams?: number): Observable<any> {
    const params: any = { productId: String(productId) };
    if (grams && grams > 0) params.grams = String(grams);
    return this.http.post(`${this.apiUrl}/cart`, null, { headers: this.getAuthHeaders(), params }).pipe(
      tap(() => { this.cartChanged.next(); this.updateItemCount(); })
    );
  }

  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/${productId}`, { headers: this.getAuthHeaders() }).pipe(
      tap(() => { this.cartChanged.next(); this.updateItemCount(); })
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart`, { headers: this.getAuthHeaders() }).pipe(
      tap(() => { this.cartChanged.next(); this.updateItemCount(); })
    );
  }

  getItemCount(): number { return this.cartItemCount; }

  // Compat localStorage (facultatif)
  addToCartLocal(product: Product): void {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const pid = product.id!;
    cart[pid] = (cart[pid] || 0) + 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartChanged.next();
  }
  getCartLocal(): { [key: number]: number } {
    return JSON.parse(localStorage.getItem('cart') || '{}');
  }
  clearCartLocal(): void {
    localStorage.removeItem('cart');
    this.cartChanged.next();
  }
}
