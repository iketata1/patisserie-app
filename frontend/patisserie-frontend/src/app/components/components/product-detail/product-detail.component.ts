// src/app/components/components/product-detail/product-detail.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from 'src/app/models/product';
import { AuthService } from 'src/services/auth.service';
import { CartService } from 'src/services/cart.service';
import { ProductService } from 'src/services/product.service';
import { AiRecoService } from 'src/services/ai-reco.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  isLoading = false;
  errorMessage = '';
  imageHidden = false;

  // quantité en grammes (prix produit = prix/kg)
  grams = 100;
  readonly steps = [100, 200, 300, 400, 500, 750, 1000];

  private sub?: Subscription;

  // --- Nouveautés: produits similaires ---
  similarProducts: Product[] = [];
  similarLoading = false;
  similarError = '';

  constructor(
    public productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private ai: AiRecoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.sub = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        this.errorMessage = 'Produit introuvable';
        this.isLoading = false;
        return;
      }
      this.productService.getProduct(id).subscribe({
        next: (p) => {
          this.product = p;
          this.isLoading = false;

          // Log de vue (si connecté)
          const uid = this.authService.getUserId?.();
          if (uid && this.product?.id) {
            this.ai.track(uid, this.product.id, 'view').subscribe({ next: () => {}, error: () => {} });
          }

          // Charger des produits similaires via l’IA
          if (this.product?.id) {
            this.loadSimilar(this.product.id);
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur lors du chargement du produit.';
          this.isLoading = false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // --- IA: similaires ---
  private loadSimilar(productId: number) {
    this.similarLoading = true;
    this.similarError = '';
    this.ai.similar(productId, 6).subscribe({
      next: (res) => {
        const items = (res?.items || []) as any[];
        // L’IA renvoie des colonnes compatibles: id, name, category, description, price, stock, imageUrl
        this.similarProducts = items.map(row => ({
          id: Number(row.id),
          name: String(row.name ?? ''),
          description: String(row.description ?? ''),
          price: Number(row.price ?? 0),
          stock: Number(row.stock ?? 0),
          imageUrl: row.imageUrl ?? '',
          category: String(row.category ?? '')
        }));
        this.similarLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.similarError = 'Impossible de charger des produits similaires.';
        this.similarLoading = false;
      }
    });
  }

  onImgError(): void {
    this.imageHidden = true;
  }

  // prix affiché = (prix/kg) * (grams / 1000)
  get computedPrice(): number {
    if (!this.product) return 0;
    const perKg = this.product.price || 0;
    return +(perKg * (this.grams / 1000)).toFixed(3);
  }

  get stockLabel(): string {
    if (!this.product) return '';
    return this.product.stock > 0 ? `${this.product.stock} en stock` : 'Rupture';
  }

  isExpired(): boolean {
    return !this.product || this.product.stock === 0 || this.product.status === 'EXPIRED';
  }

  changeGrams(value: number | null | undefined): void {
    const v = typeof value === 'number' && !isNaN(value) ? value : this.grams;
    let clamped = Math.round(v);
    if (clamped < 100) clamped = 100;
    if (clamped > 5000) clamped = 5000; // limite soft 5kg
    this.grams = clamped;
  }

  addToCart(): void {
    if (!this.product || !this.product.id) return;

    if (!this.authService.isAuthenticated()) {
      alert('Veuillez vous connecter pour ajouter au panier');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isExpired()) {
      alert('Produit indisponible');
      return;
    }

    this.cartService.addToCart(this.product.id, this.grams).subscribe({
      next: () => {
        alert('Ajouté au panier ✅');

        // Log add_to_cart (si connecté)
        const uid = this.authService.getUserId?.();
        if (uid && this.product?.id) {
          this.ai.track(uid, this.product.id, 'add_to_cart').subscribe({ next: () => {}, error: () => {} });
        }
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l’ajout au panier');
      }
    });
  }
}
