import { Component, OnInit } from '@angular/core';
 import { Product } from '../../models/product';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/services/product.service';

@Component({
  selector: 'app-product-update',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductUpdateComponent implements OnInit {
  product: Product = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    category: ''
  };
  categories = ['Gâteau', 'Pièce montée', 'Pack soutenance', 'Hlow aarbi', 'Mignardise', 'Les coffrets', 'Macaron', 'Dates farcies', 'Fêtes de naissance', 'Salé'];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getProduct(id).subscribe(data => {
      this.product = data;
    });
  }

  onSubmit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(this.product)], { type: 'application/json' }));
    this.productService.updateProduct(id, formData).subscribe(() => {
      this.router.navigate(['/nos-creations']);
    });
  }
}