// src/app/models/order.ts
import { Product } from './product';

export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  roles: string[];
}

export interface StatusUpdate {
  status: string;
  timestamp: Date;
  updatedBy?: string;
  comment?: string;
}

export interface Order {
  id?: number;
  user?: User | { id: number }; // Accepter soit un User complet, soit juste un ID
  total: number;
  status: string;
  orderDate?: Date;
  products?: Product[];
  buyerDetails?: BuyerDetails;
  statusHistory?: StatusUpdate[];
  estimatedDelivery?: Date;
  deliveryAddress?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface BuyerDetails {
  name: string;
  surname: string;
  phone: string;
  address: string;
  email?: string;
}

export interface OrderItem {
  id?: number;
  productId: number;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

// Statuts de commande avec couleurs et icônes
export const ORDER_STATUSES = {
  PENDING: { label: 'PENDING', color: '#ff9800', icon: 'schedule', description: 'Commande reçue, en attente de confirmation' },
  ACCEPTED: { label: 'ACCEPTED', color: '#2196f3', icon: 'check_circle', description: 'Commande confirmée' },
  IN_DELIVERY: { label: 'IN_DELIVERY', color: '#ff5722', icon: 'local_shipping', description: 'Votre commande est en route' },
  DELIVERED: { label: 'DELIVERED', color: '#4caf50', icon: 'done_all', description: 'Commande livrée avec succès' },
  CANCELED: { label: 'CANCELED', color: '#f44336', icon: 'cancel', description: 'Commande annulée' }
};

// Transitions valides selon le backend
export const VALID_STATUS_TRANSITIONS: { [key: string]: string[] } = {
  'PENDING': ['ACCEPTED', 'CANCELED'],
  'ACCEPTED': ['IN_DELIVERY', 'CANCELED'],
  'IN_DELIVERY': ['DELIVERED', 'CANCELED'],
  'CANCELED': ['PENDING'], // Réactivation optionnelle
  'DELIVERED': [] // État terminal
};