import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product';
import { Router } from '@angular/router';
import { ProductService } from 'src/services/product.service';
import { makeImageUrl } from '../../utils/url-utils';   // <— AJOUT

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  displayedColumns: string[] = ['id', 'name', 'description', 'price', 'stock', 'category', 'imageUrl', 'actions'];
  makeImageUrl = makeImageUrl;   // <— AJOUT

  constructor(public productService: ProductService, private router: Router) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
    });
  }

  updateProduct(id: number): void {
    this.router.navigate(['/modifier-produit', id]);
  }

  deleteProduct(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.productService.deleteProduct(id).subscribe(() => {
        this.loadProducts();
      });
    }
  }
}