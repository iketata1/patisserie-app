import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Order, ORDER_STATUSES } from '../../models/order';
import { Product } from '../../models/product';
import { OrderService } from 'src/services/order.service';
import { AuthService } from 'src/services/auth.service';
import { ProductService } from 'src/services/product.service';
import { Router } from '@angular/router';
import { WsService } from 'src/services/ws.service';
import { AiRecoService } from 'src/services/ai-reco.service';

type OrderStatusEvent = {
  orderId: number;
  newStatus: string;
  previousStatus: string;
  updatedBy: string;
  at: string;
};

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  // ---- Pour <app-reco-strip [historyIds]="recoHistoryIds">
  recoHistoryIds: number[] = [];

  // ---- Données principales
  orders: Order[] = [];
  isLoading = false;
  errorMessage = '';
  selectedOrder: Order | null = null;
  showTimelineModal = false;
  orderStatusFilter = '';

  // ---- (Optionnel) si tu affiches aussi les reco ici
  recoLoading = false;
  recoError = '';
  recommendedProducts: Product[] = [];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    public productService: ProductService,
    private ws: WsService,
    private ai: AiRecoService
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();

    // WebSocket
    this.ws.connect();

    this.subs.push(
      this.ws.subscribe<string>('/topic/test').subscribe((msg: string) => {
        console.log('[WS] /topic/test =>', msg);
      })
    );

    this.subs.push(
      this.ws.connectionChanges$.subscribe((ok: boolean) => {
        if (ok) this.ws.publish('/app/ping', 'hello');
      })
    );

    this.subs.push(
      this.ws
        .subscribe<OrderStatusEvent>('/topic/orders/status')
        .subscribe((evt: OrderStatusEvent) => {
          const idx = this.orders.findIndex(o => o.id === evt.orderId);
          if (idx >= 0) {
            this.orders[idx] = { ...this.orders[idx], status: evt.newStatus };
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getClientOrders().subscribe({
      next: (data) => {
        this.orders = data
          .slice()
          .sort((a, b) =>
            new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
          );

        // ➜ alimente l’historique pour le composant <app-reco-strip>
        this.recoHistoryIds = this.buildHistoryIds(this.orders);

        this.isLoading = false;
        if (this.orders.length === 0) {
          this.errorMessage = 'Aucune commande trouvée pour cet utilisateur';
        }

        // (Optionnel) si tu veux afficher des reco ici aussi :
        this.loadRecommendations();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.errorMessage = 'Erreur lors du chargement de vos commandes: ' + error.message;
        this.isLoading = false;

        // Historique vide → le service AI fera un fallback (best-sellers) si prévu
        this.recoHistoryIds = [];
        this.loadRecommendations();
      }
    });
  }

  /** Construit une liste d’IDs produits (dédupliqués) depuis les commandes pour <app-reco-strip> */
  private buildHistoryIds(orders: Order[]): number[] {
    const ids = new Set<number>();
    for (const o of orders) {
      (o.products || []).forEach(p => {
        if (typeof p.id === 'number') ids.add(p.id);
      });
    }
    // limite pour éviter d’envoyer des payloads énormes
    return Array.from(ids).slice(0, 50);
  }

  // ---------------- RECO interne (optionnelle) ----------------
  /** Version string pour l’API AI (si tu gardes des reco affichées ici même) */
  private buildHistoryFromOrders(): string[] {
    const ids = new Set<string>();
    for (const o of this.orders) {
      (o.products || []).forEach(p => {
        if (p.id != null) ids.add(String(p.id));
      });
    }
    return Array.from(ids);
  }

  loadRecommendations(): void {
    // Supprime ce bloc si tu relies uniquement <app-reco-strip>.
    this.recoLoading = true;
    this.recoError = '';
    this.recommendedProducts = [];

    const history = this.buildHistoryFromOrders();
    const rawId = this.authService.getUserId ? this.authService.getUserId() : null;
    const userId: number | undefined = rawId != null ? rawId : undefined;
    
    this.ai.recommend(history, 6, userId).subscribe({
      next: (res) => {
        const wanted = new Set(res.items.map(i => Number(i.productId)));
        this.productService.getProducts().subscribe({
          next: products => {
            this.recommendedProducts = products
              .filter(p => p.id != null && wanted.has(p.id))
              .sort((a, b) => {
                const sa = res.items.find(i => Number(i.productId) === a.id)?.score ?? 0;
                const sb = res.items.find(i => Number(i.productId) === b.id)?.score ?? 0;
                return sb - sa;
              });
            this.recoLoading = false;
          },
          error: err => {
            console.error(err);
            this.recoLoading = false;
            this.recoError = 'Impossible de charger les produits recommandés.';
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.recoLoading = false;
        this.recoError = 'Service de recommandations indisponible.';
      }
    });
  }
  // ------------------------------------------------------------

  // ---------- Helpers UI ----------
  getFilteredOrders(): Order[] {
    return !this.orderStatusFilter
      ? this.orders
      : this.orders.filter(order => order.status === this.orderStatusFilter);
  }

  openTimelineModal(order: Order): void {
    this.selectedOrder = { ...order };
    this.showTimelineModal = true;
  }

  closeTimelineModal(): void {
    this.showTimelineModal = false;
    this.selectedOrder = null;
  }

  getOrderStatusLabel(status: string): string {
    return this.orderService.getOrderStatusLabel(status);
  }
  getOrderStatusColor(status: string): string {
    return this.orderService.getOrderStatusColor(status);
  }
  getOrderStatusIcon(status: string): string {
    return this.orderService.getOrderStatusIcon(status);
  }

  getStatusOptions(): string[] {
    return Object.keys(ORDER_STATUSES);
  }
  getStatusLabel(status: string): string {
    return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status;
  }

  getOrderCountByStatus(status: string): number {
    return this.orders.filter(order => order.status === status).length;
  }
  getTotalOrders(): number {
    return this.orders.length;
  }
  getTotalSpent(): number {
    return this.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }
  getAverageOrderValue(): number {
    if (this.orders.length === 0) return 0;
    return this.getTotalSpent() / this.orders.length;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Date non disponible';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hideBrokenImg(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
