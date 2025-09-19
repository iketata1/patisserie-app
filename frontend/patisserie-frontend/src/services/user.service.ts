import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api-config';
import { AuthService } from './auth.service';
import { User } from 'src/app/models/order';

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUser: User | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  setUser(user: User) { this.currentUser = user; }
  getUser(): User | null { return this.currentUser; }
  clearUser() { this.currentUser = null; localStorage.removeItem('token'); }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`, { headers: this.getAuthHeaders() });
  }
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/${userId}`, { headers: this.getAuthHeaders() });
  }
  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${API_URL}/users/${userId}`, userData, { headers: this.getAuthHeaders() });
  }
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${userId}`, { headers: this.getAuthHeaders() });
  }
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users/role/${role}`, { headers: this.getAuthHeaders() });
  }
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${API_URL}/users/profile`, { headers: this.getAuthHeaders() });
  }
}
