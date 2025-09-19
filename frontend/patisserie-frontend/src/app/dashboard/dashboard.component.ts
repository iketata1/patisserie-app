import { Component, OnInit } from '@angular/core';
 import { Product } from '../models/product';
import { Order } from '../models/order';
import { AuthService } from 'src/services/auth.service';
import { DashboardService } from 'src/services/dashboard.service';
import { CartService } from 'src/services/cart.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  data: { products?: Product[], orders?: Order[] } = {};
  cartItems: { [key: number]: number } = {};
  cartTotal: number = 0;
  selectedProduct: Product | null = null;
  newQuantity: number = 0;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadData();
    this.loadCart();
  }

  loadData(): void {
    this.dashboardService.getDashboardData().subscribe(data => {
      this.data = data;
    });
  }

  loadCart(): void {
    this.cartService.getCart().subscribe(cart => {
      this.cartItems = cart.items || {};
      this.cartTotal = cart.total || 0;
    });
  }

  // Actions Admin
  addProduct(): void {
    const product: Product = { 
      name: 'Nouveau', 
      price: 10, 
      stock: 10, 
      category: 'Test',
      description: 'Description du nouveau produit',
      imageUrl: ''
    };
    this.dashboardService.createProduct(product).subscribe(() => this.loadData());
  }

  setQuantity(): void {
    if (this.selectedProduct && this.newQuantity >= 0) {
      this.dashboardService.updateProductQuantity(this.selectedProduct.id!, this.newQuantity).subscribe(() => {
        this.loadData();
        this.selectedProduct = null;
        this.newQuantity = 0;
      });
    }
  }

  // Actions Client
  addToCart(productId: number): void {
    this.dashboardService.addToCart(productId).subscribe(() => this.loadCart());
  }

  placeOrder(): void {
    // Logique à implémenter pour finaliser la commande (utiliser OrderService)
    console.log('Commande passée');
  }
}
