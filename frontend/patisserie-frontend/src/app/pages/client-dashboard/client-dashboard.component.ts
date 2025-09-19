import { Component, OnInit } from '@angular/core';
import { Order, ORDER_STATUSES } from '../../models/order';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { OrderService } from 'src/services/order.service';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit {
  orders: Order[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  selectedOrder: Order | null = null;
  showTimelineModal: boolean = false;
  orderStatusFilter: string = '';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();
  }

  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Récupérer un ID fiable via /profile
    this.authService.getProfile().subscribe({
      next: (user) => {
        if (!user || !user.id) {
          console.error('Profil utilisateur invalide:', user);
          this.errorMessage = 'Impossible de récupérer votre profil.';
          this.isLoading = false;
          return;
        }
        const userId = user.id;
        console.log('Chargement des commandes pour l\'utilisateur:', userId);

        this.orderService.getOrdersByUser(userId).subscribe({
          next: (data) => {
            this.orders = (data || []).sort((a, b) =>
              new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
            );
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des commandes:', error);
            this.errorMessage = error?.error?.message || 'Erreur lors du chargement de vos commandes';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du profil:', error);
        this.errorMessage = 'Utilisateur non connecté';
        this.isLoading = false;
      }
    });
  }

  getFilteredOrders(): Order[] {
    if (!this.orderStatusFilter) {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.orderStatusFilter);
  }

  openTimelineModal(order: Order): void {
    this.selectedOrder = order;
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

  // Méthode pour obtenir l'ID utilisateur d'une commande
  getOrderUserId(order: Order): number | null {
    return this.orderService.getUserIdFromOrder(order);
  }

  // Méthode pour vérifier si l'utilisateur est complet
  isCompleteUser(order: Order): boolean {
    if (!order.user) return false;
    return this.orderService.isCompleteUser(order.user);
  }
} 