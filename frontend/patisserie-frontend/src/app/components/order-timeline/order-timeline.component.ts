// src/app/components/order-timeline/order-timeline.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { StatusUpdate, ORDER_STATUSES } from '../../models/order';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { OrderService } from 'src/services/order.service';

@Component({
  selector: 'app-order-timeline',
  templateUrl: './order-timeline.component.html',
  styleUrls: ['./order-timeline.component.css']
})
export class OrderTimelineComponent implements OnInit {
  @Input() orderId!: number; // Garanti par le parent
  @Input() currentStatus!: string;
  @Input() statusHistory: StatusUpdate[] = []; // Passé depuis le parent
  isLoading: boolean = false;
  errorMessage: string = '';

  timelineData$: Observable<StatusUpdate[]> | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadTimelineData();
  }

  loadTimelineData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.statusHistory && this.statusHistory.length > 0) {
      this.timelineData$ = of(this.statusHistory);
      this.isLoading = false;
    } else {
      this.timelineData$ = this.orderService.getOrderStatusHistory(this.orderId).pipe(
        tap(data => {
          this.isLoading = false;
          if (!data || data.length === 0) {
            this.errorMessage = 'Aucun historique disponible pour cette commande';
          }
        }),
        catchError(error => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors du chargement de l\'historique : ' + error.message;
          return of([]);
        })
      );
    }
  }

  getStatusConfig(status: string) {
    return ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || {
      label: status,
      color: '#666',
      icon: 'help',
      description: 'Statut inconnu'
    };
  }

  getStatusColor(status: string): string {
    return this.getStatusConfig(status).color;
  }

  getStatusIcon(status: string): string {
    return this.getStatusConfig(status).icon;
  }

  getStatusLabel(status: string): string {
    return this.getStatusConfig(status).label;
  }

  getStatusDescription(status: string): string {
    return this.getStatusConfig(status).description || '';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isCurrentStatus(status: string): boolean {
    return status === this.currentStatus;
  }

  isCompleted(status: string): boolean {
    const statusOrder = ['PENDING', 'ACCEPTED', 'IN_DELIVERY', 'DELIVERED', 'CANCELED'];
    const currentIndex = statusOrder.indexOf(this.currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex <= currentIndex;
  }

  getTimelineStepClass(status: string): string {
    if (this.isCurrentStatus(status)) {
      return 'timeline-step current';
    } else if (this.isCompleted(status)) {
      return 'timeline-step completed';
    }
    return 'timeline-step pending';
  }
}