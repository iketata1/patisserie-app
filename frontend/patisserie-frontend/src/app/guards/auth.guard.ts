import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const isAuth = this.authService.isAuthenticated();
    const role = this.authService.getUserRole();
    console.log('AuthGuard - Authentifié ?', isAuth);
    console.log('AuthGuard - Rôle :', role);
    console.log('Route demandée :', state.url);

    if (!isAuth) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Vérification du rôle pour toutes les routes avec expectedRole
    const expectedRole = route.data['expectedRole'];
    if (expectedRole) {
      if (Array.isArray(expectedRole)) {
        if (!expectedRole.includes(role)) {
          console.log(`Rôle requis : ${expectedRole}, Rôle actuel : ${role}`);
          this.router.navigate(['/login']);
          return false;
        }
      } else if (role !== expectedRole) {
        console.log(`Rôle requis : ${expectedRole}, Rôle actuel : ${role}`);
        this.router.navigate(['/login']);
        return false;
      }
    }

    return true;
  }
}