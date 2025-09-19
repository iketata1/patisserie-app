import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { API_URL } from './api-config';

export interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'timeout';
  response?: any;
  error?: any;
  responseTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiTestService {
  private baseUrl = API_URL;

  constructor(private http: HttpClient) {}

  // Test de connectivité générale
  testConnectivity(): Observable<ApiTestResult[]> {
    const tests: Observable<ApiTestResult>[] = [
      this.testEndpoint('GET', '/orders'),
      this.testEndpoint('GET', '/users'),
      this.testEndpoint('POST', '/orders/1/status', { status: 'TEST' })
    ];

    return of(tests).pipe(
      map(() => []), // Pour l'instant, retourner un tableau vide
      catchError(error => {
        console.error('Erreur lors des tests de connectivité:', error);
        return of([]);
      })
    );
  }

  // Test d'un endpoint spécifique
  testEndpoint(method: string, endpoint: string, body?: any): Observable<ApiTestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🧪 Test de l'endpoint: ${method} ${url}`);

    let request: Observable<any>;
    
    switch (method.toUpperCase()) {
      case 'GET':
        request = this.http.get(url);
        break;
      case 'POST':
        request = this.http.post(url, body);
        break;
      case 'PUT':
        request = this.http.put(url, body);
        break;
      case 'DELETE':
        request = this.http.delete(url);
        break;
      default:
        return of({
          endpoint,
          status: 'error' as const,
          error: { message: 'Méthode HTTP non supportée' }
        });
    }

    return request.pipe(
      timeout(10000), // Timeout de 10 secondes
      map(response => {
        const responseTime = Date.now() - startTime;
        console.log(`✅ Endpoint ${endpoint} accessible en ${responseTime}ms`);
        return {
          endpoint,
          status: 'success' as const,
          response,
          responseTime
        };
      }),
      catchError(error => {
        const responseTime = Date.now() - startTime;
        console.error(`❌ Erreur sur l'endpoint ${endpoint}:`, error);
        
        let status: 'error' | 'timeout' = 'error';
        if (error.name === 'TimeoutError') {
          status = 'timeout';
        }
        
        return of({
          endpoint,
          status,
          error,
          responseTime
        });
      })
    );
  }

  // Test spécifique pour la mise à jour du statut
  testStatusUpdate(orderId: number, status: string): Observable<ApiTestResult> {
    return this.testEndpoint('PUT', `/orders/${orderId}/status`, { status });
  }

  // Vérification de la configuration
  checkConfiguration(): void {
    console.log('🔧 Configuration API:');
    console.log('URL de base:', this.baseUrl);
    console.log('User Agent:', navigator.userAgent);
    console.log('Timestamp:', new Date().toISOString());
  }
} 