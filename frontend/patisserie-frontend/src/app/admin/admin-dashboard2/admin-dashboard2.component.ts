import { Component, OnInit } from '@angular/core';
  import { Product } from '../../models/product';
import { Order } from '../../models/order';
import { ProductService } from 'src/services/product.service';
import { OrderService } from 'src/services/order.service';

@Component({
  selector: 'app-admin-dashboard2',
  templateUrl: './admin-dashboard2.component.html',
  styleUrls: ['./admin-dashboard2.component.css']
})
export class AdminDashboard2Component implements OnInit {
  section: string = 'orders';
  products: Product[] = [];
  orders: Order[] = [];
  // Formulaire d'ajout
  newProduct: Product = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    category: ''
  };

  constructor(
    public productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(data => this.products = data);
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe(data => this.orders = data);
  }

  addProduct() {
    const formData = new FormData();
    formData.append('name', this.newProduct.name);
    formData.append('description', this.newProduct.description);
    formData.append('price', this.newProduct.price.toString());
    formData.append('stock', this.newProduct.stock.toString());
    formData.append('imageUrl', this.newProduct.imageUrl || '');
    formData.append('category', this.newProduct.category);
    this.productService.createProduct(formData).subscribe(() => {
      this.loadProducts();
      this.newProduct = { name: '', description: '', price: 0, stock: 0, imageUrl: '', category: '' };
    });
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
  }

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PAID': return 'badge paid';
      case 'PENDING': return 'badge pending';
      case 'DELIVERED': return 'badge delivered';
      case 'COMPLETED': return 'badge completed';
      default: return 'badge';
    }
  }
}
