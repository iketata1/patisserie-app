import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private refreshSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {}

  startTokenRefresh() {
    // Refresh token every 14 minutes (assuming token expires in 15 minutes)
    this.refreshSubscription = interval(14 * 60 * 1000).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.authService.refreshToken().subscribe({
          next: (response) => {
            if (response.token) {
              this.authService.setToken(response.token);
              console.log('Token refreshed successfully');
            }
          },
          error: (error) => {
            console.error('Token refresh failed:', error);
            // If refresh fails, logout the user
            this.authService.logout();
          }
        });
      }
    });
  }

  stopTokenRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }
} 