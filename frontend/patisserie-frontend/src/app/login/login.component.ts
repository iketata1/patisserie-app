import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { TokenRefreshService } from 'src/services/token-refresh.service';
import { UserService } from 'src/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private tokenRefreshService: TokenRefreshService,
    private router: Router,
    private route: ActivatedRoute // Ajout de ActivatedRoute
  ) {}

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);
        console.log('Token reçu :', response.token);
        this.getUserProfile();
      },
      error: (error) => {
        this.errorMessage = 'Échec de la connexion. Vérifiez votre nom d\'utilisateur/mot de passe ou l\'état du serveur.';
        console.error('Erreur de login :', error);
      }
    });
  }

  getUserProfile() {
    this.authService.getProfile().subscribe({
      next: (user) => {
        console.log('Profil utilisateur :', user);
        this.userService.setUser(user);
        this.tokenRefreshService.startTokenRefresh();
        console.log('Authentifié ?', this.authService.isAuthenticated());
        console.log('Rôle :', this.authService.getUserRole());
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/nos-creations';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        console.error('Échec de la récupération du profil utilisateur :', error);
        this.errorMessage = 'Impossible de récupérer le profil utilisateur. Veuillez réessayer.';
      }
    });
  }
}