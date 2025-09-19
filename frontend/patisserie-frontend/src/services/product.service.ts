// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Product } from 'src/app/models/product';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.API_BASE}/products`;
  private imageBaseUrl = environment.FILES_BASE;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getImageUrl(path?: string): string {
    if (!path) return 'assets/placeholder.png';
    const base = environment.serverBaseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : '/' + path;
    return `${base}${p}`;   // => http://localhost:8084/inesk/uploads/xxx.jpg
  }
  

  /** À brancher sur (error) des <img> */
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = this.placeholder();
  }

  private placeholder(): string {
    return 'assets/img/no-image.png';
  }

  getImage(imageUrl: string): Observable<Blob> {
    const url = this.getImageUrl(imageUrl);
    return this.http.get(url, { responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  private authHeaders(): HttpHeaders {
    const t = this.auth.getToken();
    return t ? new HttpHeaders().set('Authorization', `Bearer ${t}`) : new HttpHeaders();
  }

  getProducts(category?: string): Observable<Product[]> {
    let url = this.apiUrl;
    if (category && category !== 'Toutes') url += `?category=${encodeURIComponent(category)}`;
    return this.http.get<Product[]>(url, { headers: this.authHeaders() }).pipe(
      tap(p => console.log('Products loaded:', p?.length ?? 0)),
      catchError(this.handleError)
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(catchError(this.handleError));
  }

  createProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, formData, { headers: this.authHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateProduct(id: number, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData, { headers: this.authHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) msg = `Erreur: ${error.error.message}`;
    else msg = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
    console.error('ProductService error:', error);
    return throwError(() => new Error(msg));
  }
}
