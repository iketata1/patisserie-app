import { Component, OnInit } from '@angular/core';
 import { Product } from '../../models/product';
import { ProductService } from 'src/services/product.service';
import { makeImageUrl } from '../../utils/url-utils';   // <— AJOUT

@Component({
  selector: 'app-nos-creations',
  templateUrl: './nos-creations.component.html',
  styleUrls: ['./nos-creations.component.css']
})
export class NosCreationsComponent implements OnInit {
  products: Product[] = [];
  categories: string[] = [
    'Toutes', 'Gâteau', 'Pièce montée', 'Pack soutenance', 'Hlow aarbi',
    'Mignardise', 'Les coffrets', 'Macaron', 'Dates farcies',
    'Fêtes de naissance', 'Salé'
  ];
  selectedCategory: string = 'Toutes';
  errorMessage: string | null = null;
  isLoading: boolean = false;
  makeImageUrl = makeImageUrl;   // <— AJOUT

  constructor(public productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.checkExpiredProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const category = this.selectedCategory !== 'Toutes' ? this.selectedCategory : undefined;

    this.productService.getProducts(category).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Erreur lors du chargement des produits. Veuillez réessayer.';
        this.isLoading = false;
        this.products = [];
      }
    });
  }

  onCategoryChange(): void {
    this.loadProducts();
  }

  checkExpiredProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        products.forEach(product => {
          if (product.stock === 0 && (!product.status || product.status !== 'EXPIRED')) {
            console.log(`Produit ${product.name} pourrait être marqué comme EXPIRED`);
          }
        });
      },
      error: (error) => console.error('Erreur lors de la vérification des produits expirés:', error)
    });
  }
}
