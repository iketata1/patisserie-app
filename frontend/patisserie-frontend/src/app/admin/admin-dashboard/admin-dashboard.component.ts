import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Product } from '../../models/product';
import { Order, ORDER_STATUSES } from '../../models/order';
import { User } from '../../models/user';

import { ProductService } from 'src/services/product.service';
import { OrderService } from 'src/services/order.service';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { ApiTestService } from 'src/services/api-test.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  // ---- UI ----
  selectedSection: string = 'products';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  showHelp: boolean = false;

  // ---- DATA ----
  products: Product[] = [];
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  clients: User[] = [];

  // ---- ORDERS view state ----
  ordersPage: number = 1;
  ordersPageSize: number = 6;
  orderStatusFilter: string = '';
  orderSearch: string = '';
  availableStatuses = Object.keys(ORDER_STATUSES);

  // ---- STATS ----
  chiffreAffaires: number = 0;

  // ---- STATUS MODAL ----
  selectedOrderId: number | null = null;
  newStatus: string = '';
  statusComment: string = '';
  showStatusModal: boolean = false;

  // ---- TIMELINE MODAL ----
  showTimelineModal: boolean = false;
  selectedOrderForTimeline: Order | null = null;

  // ---- ADD PRODUCT FORM ----
  newProduct: Product = {
    name: '',
    price: 0,
    stock: 0,
    category: '',
    description: '',
    imageUrl: ''
  };

  constructor(
    public productService: ProductService,
    private orderService: OrderService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private apiTestService: ApiTestService,
    private http: HttpClient
  ) {}

  // Utilitaire: logue les 403 sans spammer la console
  private quiet403(where: string, err: any) {
    if (err?.status === 403) {
      console.warn(`[${where}] 403 – accès protégé (rôle ADMIN requis)`);
    } else {
      console.error(`[${where}]`, err);
    }
  }

  // ---------------- Lifecycle ----------------
  ngOnInit(): void {
    this.loadProducts();

    // ⚠️ Évite les 403: ne charge commandes/clients que si ADMIN
    const role = this.authService.getUserRole();
    if (role === 'ADMIN') {
      this.loadOrders();
      this.loadClients();
    }

    // Ne PAS lancer testApiConnectivity automatiquement
    // (garde le bouton "Test API" pour le faire à la demande)
  }

  ngAfterViewInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.setSection(fragment);
        setTimeout(() => {
          document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });
  }

  // ---------------- Loads ----------------
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des produits.';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data || [];
        this.applyOrderFilters();
        this.chiffreAffaires = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        this.isLoading = false;
      },
      error: (err) => {
        this.quiet403('GET /orders', err);
        // Message discret si 403
        if (err.status === 403) {
          this.errorMessage = 'Accès aux commandes interdit. Connectez-vous en ADMIN.';
        } else {
          this.errorMessage = err.message || 'Erreur lors du chargement des commandes';
        }
        this.orders = [];
        this.filteredOrders = [];
        this.chiffreAffaires = 0;
        this.isLoading = false;
      }
    });
  }

  loadClients(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => { this.clients = data; },
      error: (err) => this.quiet403('GET /users', err)
    });
  }

  // ---------------- Test API (à la demande) ----------------
  testApiConnectivity(): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);

    // /users/profile
    this.http.get(`${this.orderService['apiUrl']}/users/profile`, { headers }).subscribe({
      next: (res) => console.log('✅ /users/profile OK:', res),
      error: (err) => this.quiet403('GET /users/profile', err)
    });

    // /orders (protégé ADMIN)
    this.http.get(`${this.orderService['apiUrl']}/orders`, { headers }).subscribe({
      next: (res) => console.log('✅ /orders OK:', res),
      error: (err) => this.quiet403('GET /orders', err)
    });

    // /products (public)
    this.http.get(`${this.orderService['apiUrl']}/products`).subscribe({
      next: (res) => console.log('✅ /products OK:', res),
      error: (err) => console.error('❌ /products', err)
    });
  }

  // ---------------- Sections / Filters / Paging ----------------
  setSection(section: string): void {
    this.selectedSection = section;
    this.errorMessage = null;
    if (section === 'orders') this.applyOrderFilters();
  }

  getSectionTitle(): string {
    switch (this.selectedSection) {
      case 'add-product': return 'Ajouter un produit';
      case 'orders': return 'Commandes';
      case 'products': return 'Liste des produits';
      default: return '';
    }
  }

  applyOrderFilters(): void {
    let filtered = this.orders;
    if (this.orderStatusFilter) {
      filtered = filtered.filter(o => o.status === this.orderStatusFilter);
    }
    if (this.orderSearch) {
      const s = this.orderSearch.toLowerCase();
      filtered = filtered.filter(o =>
        (o.buyerDetails?.name?.toLowerCase().includes(s) ||
         o.buyerDetails?.surname?.toLowerCase().includes(s) ||
         (o.id && o.id.toString().includes(s)))
      );
    }
    const start = (this.ordersPage - 1) * this.ordersPageSize;
    this.filteredOrders = filtered.slice(start, start + this.ordersPageSize);
  }

  onOrderStatusFilterChange(status: string) {
    this.orderStatusFilter = status;
    this.ordersPage = 1;
    this.applyOrderFilters();
  }

  onOrderSearchChange(search: string) {
    this.orderSearch = search;
    this.ordersPage = 1;
    this.applyOrderFilters();
  }

  onOrdersPageChange(page: number) {
    this.ordersPage = page;
    this.applyOrderFilters();
  }

  toggleHelp(): void { this.showHelp = !this.showHelp; }

  // ---------------- Products ----------------
  addProduct(): void {
    if (this.newProduct.name && this.newProduct.price >= 0 && this.newProduct.stock >= 0) {
      const formData = new FormData();
      formData.append('name', this.newProduct.name);
      formData.append('price', this.newProduct.price.toString());
      formData.append('stock', this.newProduct.stock.toString());
      formData.append('category', this.newProduct.category);
      formData.append('description', this.newProduct.description);
      formData.append('imageUrl', this.newProduct.imageUrl || '');

      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.loadProducts();
          this.newProduct = { name: '', price: 0, stock: 0, category: '', description: '', imageUrl: '' };
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de l\'ajout du produit.';
          console.error(error);
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs correctement.';
    }
  }

  updateProduct(id: number): void { this.router.navigate(['/modifier-produit', id]); }
  editProduct(id: number): void { this.router.navigate(['/modifier-produit', id]); }

  deleteProduct(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: (error) => {
        this.errorMessage = 'Erreur lors de la suppression du produit.';
        console.error(error);
      }
    });
  }

  // ---------------- Orders: status & timeline ----------------
  openStatusModal(orderId: number): void {
    this.selectedOrderId = orderId;
    this.newStatus = '';
    this.statusComment = '';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedOrderId = null;
    this.newStatus = '';
    this.statusComment = '';
    this.errorMessage = null;
  }

  updateOrderStatus(): void {
    if (!this.newStatus || !this.selectedOrderId) {
      this.errorMessage = 'Veuillez sélectionner un nouveau statut.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const order = this.orders.find(o => o.id === this.selectedOrderId);
    if (!order) {
      this.errorMessage = 'Commande non trouvée dans la liste locale.';
      this.isLoading = false;
      return;
    }

    this.orderService.updateOrderStatus(this.selectedOrderId, this.newStatus, this.statusComment).subscribe({
      next: (updatedOrder) => {
        const i = this.orders.findIndex(o => o.id === this.selectedOrderId);
        if (i !== -1) this.orders[i] = updatedOrder;
        this.loadOrders();       // resync
        this.closeStatusModal(); // close modal
        this.isLoading = false;
      },
      error: (error) => {
        let msg = 'Erreur lors de la mise à jour du statut.';
        if (error.status === 401) msg = 'Session expirée. Veuillez vous reconnecter.';
        else if (error.status === 403) msg = 'Permissions insuffisantes pour modifier cette commande.';
        else if (error.status === 404) msg = 'Commande non trouvée.';
        else if (error.status === 500) msg = 'Erreur serveur. Veuillez réessayer plus tard.';
        else if (error.error && error.error.message) msg = error.error.message;

        this.errorMessage = msg;
        this.isLoading = false;
      }
    });
  }

  openTimelineModal(order: Order): void {
    this.selectedOrderForTimeline = order;
    this.showTimelineModal = true;
  }

  closeTimelineModal(): void {
    this.showTimelineModal = false;
    this.selectedOrderForTimeline = null;
  }

  // ---------------- Helpers / Stats ----------------
  getOrderStatusLabel(status: string): string { return this.orderService.getOrderStatusLabel(status); }
  getOrderStatusColor(status: string): string { return this.orderService.getOrderStatusColor(status); }
  getOrderStatusIcon(status: string): string  { return this.orderService.getOrderStatusIcon(status); }

  getStatusOptions(): string[] { return this.availableStatuses; }
  getStatusLabel(status: string): string { return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status; }

  getOrderUserId(order: Order): number | null { return this.orderService.getUserIdFromOrder(order); }
  isCompleteUser(order: Order): boolean { return !!order.user && this.orderService.isCompleteUser(order.user); }

  getOrderCountByStatus(status: string): number { return this.orders.filter(o => o.status === status).length; }
  getTotalOrders(): number { return this.orders.length; }
  getAverageOrderValue(): number { return this.orders.length ? this.chiffreAffaires / this.orders.length : 0; }

  forceReloadOrders(): void {
    this.errorMessage = null;
    this.orders = [];
    this.filteredOrders = [];
    this.chiffreAffaires = 0;
    setTimeout(() => this.loadOrders(), 100);
  }

  diagnoseOrdersState(): void {
    console.log('Orders:', this.orders);
    console.log('Filtered:', this.filteredOrders);
    console.log('Page:', this.ordersPage, 'Size:', this.ordersPageSize);
    console.log('Filter:', this.orderStatusFilter, 'Search:', this.orderSearch);
    console.log('CA:', this.chiffreAffaires);
    console.log('Loading:', this.isLoading, 'Error:', this.errorMessage);
  }

  forceLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  checkAuthStatus(): void {
    const isLogged = this.authService.isLoggedIn();
    const token = this.authService.getToken();
    const userRole = this.authService.getUserRole();
    console.log({ isLogged, hasToken: !!token, userRole });
    if (token) {
      try { console.log('JWT payload:', JSON.parse(atob(token.split('.')[1]))); }
      catch (e) { console.error('Token invalide:', e); }
    }
  }

  diagnoseUserRole(): void {
    const token = this.authService.getToken();
    if (!token) { console.error('Aucun token'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const hasAdmin = Array.isArray(payload.roles) &&
        payload.roles.some((r: string) => r === 'ROLE_ADMIN' || r === 'ADMIN');
      console.log('Payload:', payload, 'hasAdmin:', hasAdmin);
    } catch (e) { console.error('JWT decode error:', e); }
  }

  testCreateAdminUser(): void {
    const adminUser = {
      username: 'admin_test',
      password: 'admin123',
      email: 'admin@test.com',
      nom: 'Admin',
      prenom: 'Test',
      adresse: 'Test Address',
      telephone: '123456789',
      roles: ['ADMIN']
    };
    this.http.post(`${this.orderService['apiUrl']}/users/register`, adminUser).subscribe({
      next: (res) => console.log('Admin créé:', res),
      error: (err) => console.error('Erreur création admin:', err)
    });
  }

  testCreateOrder(): void {
    const testOrder = {
      products: [{ id: 1, name: 'Test Product', price: 10.0, quantity: 1 }],
      total: 10.0,
      status: 'PENDING',
      buyerDetails: { name: 'Test', surname: 'User', phone: '123456789', address: 'Test Address' }
    };
    this.http.post(`${this.orderService['apiUrl']}/orders`, testOrder, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken() || ''}`)
    }).subscribe({
      next: (res) => { console.log('Commande test OK:', res); setTimeout(() => this.loadOrders(), 800); },
      error: (err) => console.error('Erreur création commande:', err)
    });
  }

  deleteOrder(orderId: number): void {
    if (!orderId) return;
    if (!confirm(`Supprimer la commande N° ${orderId} ?`)) return;

    this.isLoading = true;
    this.http.delete(`${this.orderService['apiUrl']}/orders/${orderId}`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken() || ''}`)
    }).subscribe({
      next: () => { this.isLoading = false; this.loadOrders(); },
      error: (error) => {
        console.error('Delete order error:', error);
        this.isLoading = false;
        if (error.status === 404) this.errorMessage = 'Commande non trouvée.';
        else if (error.status === 403) this.errorMessage = 'Accès interdit.';
        else if (error.status === 0) this.errorMessage = 'Backend indisponible.';
        else this.errorMessage = error?.error?.message || `Erreur: ${error.status} - ${error.statusText}`;
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  trackByOrderId(index: number, order: Order): number { return order.id || index; }
}
