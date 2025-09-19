import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';



@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private backendOrigin = 'http://localhost:8084';

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // CIBLER TOUTES les requêtes vers ton backend, avec ou sans /inesk
    const isBackend = req.url.startsWith(this.backendOrigin + '/');

    // Ne pas injecter le token pour les uploads statiques si tu veux
    const isStatic = req.url.includes('/uploads/');

    if (token && isBackend && !isStatic) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req);
  }
}

// n’oublie pas de l’enregistrer dans app.module.ts (providers)
