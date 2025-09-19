// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Order, ORDER_STATUSES, StatusUpdate, User, VALID_STATUS_TRANSITIONS } from 'src/app/models/order';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = environment.API_BASE;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  getOrders(): Observable<Order[]> {
    const token = this.auth.getToken();
    if (!token) return throwError(() => new Error('Authentication token missing'));
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { headers: this.getAuthHeaders() }).pipe(
      tap(data => console.log('Orders fetched:', Array.isArray(data) ? data.length : 'invalid')),
      map(d => (Array.isArray(d) ? d : [])),
      catchError(err => throwError(() => new Error('Failed to load orders: ' + err.message)))
    );
  }

  getClientOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/client/orders`, { headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('Réponse /client/orders:', d)),
      map(orders => (Array.isArray(orders) ? orders : [])),
      catchError(error => throwError(() => new Error('Failed to load client orders: ' + error.message)))
    );
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`, { headers: this.getAuthHeaders() });
  }

  saveOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, order, { headers: this.getAuthHeaders() });
  }

  updateOrderStatus(orderId: number, status: string, comment?: string): Observable<Order> {
    const body = { status, comment };
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/status`, body, { headers: this.getAuthHeaders() });
  }

  getOrderStatusHistory(orderId: number): Observable<StatusUpdate[]> {
    return this.http.get<StatusUpdate[]>(`${this.apiUrl}/orders/${orderId}/status-history`, { headers: this.getAuthHeaders() });
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/status/${status}`, { headers: this.getAuthHeaders() });
  }

  cancelOrder(orderId: number, reason?: string): Observable<Order> {
    const payload: { status: string; comment?: string } = { status: 'CANCELED' };
    if (reason) payload.comment = reason;
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/status`, payload, { headers: this.getAuthHeaders() });
  }

  // Helpers (inchangés)
  getOrderStatusLabel(status: string): string { return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status; }
  getOrderStatusColor(status: string): string { return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.color || '#666'; }
  getOrderStatusIcon(status: string): string { return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.icon || 'help'; }
  getOrderStatusDescription(status: string): string { return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.description || ''; }
  getNextStatus(currentStatus: string): string[] { return VALID_STATUS_TRANSITIONS[currentStatus] || []; }
  isValidStatusTransition(fromStatus: string, toStatus: string): boolean { return (VALID_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus); }
  getAvailableStatuses(): string[] { return Object.keys(ORDER_STATUSES); }
  isValidStatus(status: string): boolean { return status in ORDER_STATUSES; }
  getUserIdFromOrder(order: Order): number | null { if (!order.user) return null; if (typeof order.user === 'object' && 'id' in order.user) return (order.user as any).id; return null; }
  isCompleteUser(user: User | { id: number }): user is User { return 'username' in user && 'email' in user; }
}
