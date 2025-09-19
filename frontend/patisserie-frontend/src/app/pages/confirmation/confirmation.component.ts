import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {
  orderId: number | null = null;
  total: number = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Récupère l'ID et le total depuis les query parameters
    this.orderId = Number(this.route.snapshot.queryParamMap.get('id')) || null;
    this.total = Number(this.route.snapshot.queryParamMap.get('total')) || 0;
    console.log('Confirmation data:', { orderId: this.orderId, total: this.total }); // Débogage
  }
} 