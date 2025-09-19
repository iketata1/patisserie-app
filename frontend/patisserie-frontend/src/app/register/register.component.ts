import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { User } from '../models/user';
import { API_URL } from 'src/services/api-config';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  user: User = {
    username: '',
    password: '',
    email: '',
    nom: '',
    prenom: '',
    adresse: '',
    telephone: '',
    roles: ['CLIENT'], // rôle par défaut
  };

  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    // validations simples
    if (!this.user.username || !this.user.password || !this.user.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide.';
      return;
    }
    if (this.user.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: User = {
      username: this.user.username,
      password: this.user.password,
      email: this.user.email,
      nom: this.user.nom || '',
      prenom: this.user.prenom || '',
      adresse: this.user.adresse || '',
      telephone: this.user.telephone || '',
      roles: ['CLIENT'],
    };

    // IMPORTANT: endpoint corrigé
    this.http.post(`${API_URL}/users/register`, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        if (error?.status === 400 && error?.error === 'Username already exists') {
          this.errorMessage = 'Ce nom d’utilisateur existe déjà.';
        } else if (error?.status === 400) {
          this.errorMessage = 'Erreur lors de l’inscription. Vérifiez vos informations.';
        } else {
          this.errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
        }
      },
    });
  }

  resetForm() {
    this.user = {
      username: '',
      password: '',
      email: '',
      nom: '',
      prenom: '',
      adresse: '',
      telephone: '',
      roles: ['CLIENT'],
    };
    this.confirmPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  goToLogin() { this.router.navigate(['/login']); }
}
