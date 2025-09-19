import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { API_URL } from './api-config';
import { jwtDecode } from 'jwt-decode';
import { User } from 'src/app/models/order';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/users/login`, { username, password });
  }

  refreshToken(): Observable<any> {
    const token = this.tokenSubject.value;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    return this.http.get(`${API_URL}/users/refresh-token`, { headers });
  }

  getProfile(): Observable<User> {
    const token = this.tokenSubject.value;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    return this.http.get<User>(`${API_URL}/users/profile`, { headers });
  }

  setLoginToken(token: string): void { this.setToken(token); }
  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null { return this.tokenSubject.value; }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean { return !!this.tokenSubject.value; }
  isLoggedIn(): boolean { return this.isAuthenticated(); }

  // Rôle brut (toujours préfixé ROLE_)
  getRawUserRole(): string {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        let role = decoded.roles?.[0] ?? 'ROLE_CLIENT';
        return role.startsWith('ROLE_') ? role : 'ROLE_' + String(role).toUpperCase();
      } catch (e) {
        console.error('jwt decode error:', e);
      }
    }
    return 'ROLE_CLIENT';
  }

  // Rôle simplifié (CLIENT/ADMIN)
  getUserRole(): string {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        let role = decoded.roles?.[0] ?? 'CLIENT';
        if (role.startsWith('ROLE_')) role = role.substring(5);
        return role;
      } catch (e) {
        console.error('jwt decode error:', e);
      }
    }
    return 'CLIENT';
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub ? Number(decoded.sub) : null;
    } catch (e) {
      console.error('jwt decode error (sub):', e);
      return null;
    }
  }
}
