import { Component, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../models/product';
import { Order } from '../../models/order';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CartService } from 'src/services/cart.service';
import { OrderService } from 'src/services/order.service';
import { ProductService } from 'src/services/product.service';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit, OnDestroy {
  total = 0;
  products: Product[] = [];
  buyerDetails = { name: '', surname: '', phone: '', address: '' };
  order: Order = {
    orderDate: new Date(),
    status: 'PENDING',
    total: 0,
    products: []
  };
  errorMessage: string | null = null;
  private cartSubscription: Subscription | undefined;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCartItems();
    this.cartSubscription = this.cartService.cartChanged.subscribe(() => {
      this.loadCartItems();
    });
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCartItems() {
    this.cartService.getCart().subscribe(
      (cart) => {
        const productIds = Object.keys(cart.items).map(id => +id);
        if (productIds.length > 0) {
          this.productService.getProducts().subscribe(
            (products) => {
              this.products = products
                .filter(p => productIds.includes(p.id!))
                .map(p => ({
                  ...p,
                  quantity: cart.items[p.id!] || 1
                }));
              this.calculateTotal();
            },
            error => console.error('Erreur chargement produits:', error)
          );
        } else {
          this.products = [];
          this.calculateTotal();
        }
      },
      error => console.error('Erreur chargement panier:', error)
    );
  }

  calculateTotal() {
    this.total = this.products.reduce((sum, product) => sum + (product.price * (product.quantity || 1)), 0);
    this.order.total = this.total;
    this.order.products = this.products;
    console.log('Calculated order:', JSON.stringify(this.order));
  }

  confirmOrder() {
    if (!this.buyerDetails.name || !this.buyerDetails.surname || !this.buyerDetails.phone || !this.buyerDetails.address) {
      this.errorMessage = "Veuillez remplir tous les détails de l'acheteur.";
      return;
    }
    if (!this.products.length) {
      this.errorMessage = "Le panier est vide. Ajoutez des produits avant de confirmer.";
      return;
    }
  
    this.authService.getProfile().pipe(
      switchMap(user => {
        if (!user || !user.id || !user.username) {
          throw new Error('Impossible de récupérer l\'ID ou le username de l\'utilisateur.');
        }
        this.buyerDetails.name = user.username; // Assurez-vous que buyerDetails.name correspond au username
        const orderToSend: Order = {
          orderDate: new Date(),
          status: 'PENDING',
          total: this.total,
          products: this.products.map(p => ({
            id: p.id,
            quantity: p.quantity || 1,
            price: p.price,
            productName: p.name,
            productImage: p.imageUrl
          }) as any),
          user: { id: user.id }, // Utilisez l'ID pour la relation
          buyerDetails: this.buyerDetails
        };
        console.log('Order being sent:', JSON.stringify(orderToSend));
        return this.orderService.saveOrder(orderToSend);
      }),
      catchError(error => {
        console.error('Error saving order:', error);
        this.errorMessage = error.error?.message || error.message || 'Erreur lors de la confirmation de la commande.';
        return of(null);
      })
    ).subscribe(
      (response) => {
        if (response) {
          console.log('Order saved successfully:', response);
          this.cartService.clearCart().subscribe(() => {
            this.router.navigate(['/client-dashboard']);
          });
        }
      }
    );
  }
  removeFromCart(productId: number) {
    this.cartService.removeFromCart(productId).subscribe(
      () => {
        this.loadCartItems();
      },
      error => {
        this.errorMessage = "Erreur lors de la suppression du produit du panier.";
      }
    );
  }
}