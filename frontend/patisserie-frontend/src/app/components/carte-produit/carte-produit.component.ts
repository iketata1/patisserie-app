import { Component, Input } from '@angular/core';
import { Product } from '../../models/product';
import { Router } from '@angular/router';
import { ProductService } from 'src/services/product.service';
import { CartService } from 'src/services/cart.service';
import { AuthService } from 'src/services/auth.service';
import { OrderService } from 'src/services/order.service';

@Component({
  selector: 'app-carte-produit',
  templateUrl: './carte-produit.component.html',
  styleUrls: ['./carte-produit.component.css']
})
export class CarteProduitComponent {
  @Input() produit!: Product;

  imageHidden = false; // si erreur, on masque l’image (pas de placeholder imposé)

  constructor(
    public productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private orderService: OrderService
  ) {}

  get displayName(): string {
    return this.produit.name;
  }

  get displayPrice(): string {
    return this.produit.price + ' DT';
  }

  get displayDescription(): string {
    return this.produit.description;
  }

  get displayStock(): string {
    return this.produit.stock !== undefined ? String(this.produit.stock) : '';
  }

  isProductExpired(): boolean {
    return this.produit.stock === 0 || this.produit.status === 'EXPIRED';
  }

  onImgError(): void {
    // Tu ne veux pas d'image statique ? on masque simplement l'image.
    this.imageHidden = true;
  }

  addToCart(event?: any): void {
    if (!this.authService.isAuthenticated()) {
      alert('Veuillez vous connecter pour ajouter des produits au panier');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isProductExpired()) {
      console.log(`Produit ${this.produit.name} est expiré ou en rupture de stock, impossible d'ajouter au panier`);
      return;
    }
    if (this.produit.id) {
      this.cartService.addToCart(this.produit.id).subscribe(
        () => {
          console.log(`Produit ${this.produit.name} ajouté au panier`);
          const button = event?.target as HTMLButtonElement;
          if (button) {
            const originalText = button.textContent;
            button.textContent = '✓ Ajouté !';
            button.style.background = '#28a745';
            button.style.color = 'white';
            setTimeout(() => {
              button.textContent = originalText || 'Ajouter au panier';
              button.style.background = '';
              button.style.color = '';
            }, 1500);
          }
        },
        error => {
          console.error('Erreur lors de l\'ajout au panier:', error);
          alert('Erreur lors de l\'ajout au panier. Veuillez réessayer.');
        }
      );
    }
  }
}
