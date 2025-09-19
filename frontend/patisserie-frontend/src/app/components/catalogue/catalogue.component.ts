import { Component, OnInit } from '@angular/core';
    import { Product } from '../../models/product';
import { ProductService } from 'src/services/product.service';

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.css']
})
export class CatalogueComponent implements OnInit {
  products: Product[] = [];
  categories: string[] = ['Toutes', 'Gâteau', 'Pièce montée', 'Pack soutenance', 'Hlow aarbi', 'Mignardise', 'Les coffrets', 'Macaron', 'Dates farcies', 'Fêtes de naissance', 'Salé'];
  selectedCategory: string = 'Toutes';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(public productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const category = this.selectedCategory !== 'Toutes' ? this.selectedCategory : undefined;
    
    this.productService.getProducts(category).subscribe({
      next: (data) => {
      this.products = data;
        this.isLoading = false;
        console.log(`Produits chargés: ${data.length} produits`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.errorMessage = 'Erreur lors du chargement des produits. Veuillez réessayer.';
        this.isLoading = false;
        this.products = [];
      }
    });
  }

  onCategoryChange(): void {
    this.loadProducts();
  }

  resetFilter(): void {
    this.selectedCategory = 'Toutes';
    this.loadProducts();
  }

  trackByProductId(index: number, product: Product): number {
    return product.id || index;
  }

  updateProduct(id: number): void {
    // Implémenter la navigation si nécessaire
    console.log('Mise à jour du produit:', id);
  }

  deleteProduct(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          console.log('Produit supprimé avec succès');
          this.loadProducts(); // Recharger la liste
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du produit');
        }
      });
    }
  }

  // Méthode pour obtenir le nombre de produits par catégorie
  getProductCountByCategory(category: string): number {
    if (category === 'Toutes') {
      return this.products.length;
    }
    return this.products.filter(product => product.category === category).length;
  }

  // Méthode pour vérifier si des produits sont disponibles
  hasProducts(): boolean {
    return this.products.length > 0;
  }

  // Méthode pour obtenir les produits filtrés
  getFilteredProducts(): Product[] {
    if (this.selectedCategory === 'Toutes') {
      return this.products;
    }
    return this.products.filter(product => product.category === this.selectedCategory);
  }
}