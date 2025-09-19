import { Component, HostListener } from '@angular/core';
 import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CartService } from 'src/services/cart.service';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { TokenRefreshService } from 'src/services/token-refresh.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isScrolled = false;
  itemCount: number = 0;
  private cartSubscription: Subscription;
  private tokenSubscription: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private userService: UserService,
    private tokenRefreshService: TokenRefreshService,
    private router: Router
  ) {
    this.cartSubscription = this.cartService.cartChanged.subscribe(() => {
      this.updateItemCount();
    });
    this.tokenSubscription = this.authService.token$.subscribe(() => {
      this.updateItemCount();
    });
    this.updateItemCount();
  }

  updateItemCount(): void {
    this.itemCount = this.cartService.getItemCount();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getCurrentUser() {
    return this.userService.getUser();
  }

  getUserRole(): string {
    return this.authService.getUserRole();
  }

  logout() {
    this.authService.logout();
    this.userService.clearUser();
    this.tokenRefreshService.stopTokenRefresh();
    this.router.navigate(['/login']);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  ngOnDestroy(): void {
    this.cartSubscription.unsubscribe();
    if (this.tokenSubscription) this.tokenSubscription.unsubscribe();
  }
}