import { Component, OnInit } from '@angular/core';
 import { Product } from '../../models/product';
import { Router } from '@angular/router';
import { ProductService } from 'src/services/product.service';

@Component({
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css']
})
export class ProductCreateComponent implements OnInit {
  product: Product = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    category: ''
  };
  imageFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null; // aperçu local (avant upload)
  imgSrc: string | null = null; // URL finale pour l’affichage (après upload/retour backend)
  categories = ['Gâteau', 'Pièce montée', 'Pack soutenance', 'Hlow aarbi', 'Mignardise', 'Les coffrets', 'Macaron', 'Dates farcies', 'Fêtes de naissance', 'Salé'];

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit() {}

  // --- VERSION SIMPLE : URL directe (recommandé)
  loadImage(imageUrl: string) {
    if (imageUrl) {
      this.imgSrc = this.productService.getImageUrl(imageUrl);
    } else {
      this.imgSrc = null;
    }
  }

  // --- Si tu préfères blob, décommente ce bloc et commente la version simple au-dessus.
  // loadImage(imageUrl: string) {
  //   if (imageUrl) {
  //     this.productService.getImage(imageUrl).subscribe(
  //       (blob) => this.imgSrc = URL.createObjectURL(blob),
  //       (error) => {
  //         console.error('Erreur chargement image:', error);
  //         this.imgSrc = null;
  //       }
  //     );
  //   } else {
  //     this.imgSrc = null;
  //   }
  // }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Gâteau': 'cake',
      'Pièce montée': 'celebration',
      'Pack soutenance': 'school',
      'Hlow aarbi': 'local_cafe',
      'Mignardise': 'favorite',
      'Les coffrets': 'card_giftcard',
      'Macaron': 'circle',
      'Dates farcies': 'eco',
      'Fêtes de naissance': 'cake',
      'Salé': 'restaurant'
    };
    return iconMap[category] || 'category';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleImageFile(file);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleImageFile(file);
    }
  }

  private handleImageFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximum : 10MB');
      return;
    }
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = e => this.imagePreview = reader.result;
    reader.readAsDataURL(file);
  }

  editImage(): void {
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
  }

  previewProduct(): void {
    console.log('Aperçu du produit:', this.product);
    alert('Fonctionnalité d\'aperçu à implémenter');
  }

  onSubmit(): void {
    if (!this.product.name || !this.product.category || this.product.price <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(this.product)], { type: 'application/json' }));
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        // le backend renvoie response.imageUrl = "/uploads/<fichier>"
        if (response.imageUrl) {
          this.loadImage(response.imageUrl); // affiche l'image avec l'URL corrigée
        }
        this.resetForm();
        this.router.navigate(['/nos-creations']);
      },
      error: (error) => {
        console.error('Erreur lors de la création du produit:', error);
        alert('Erreur lors de la création du produit');
      }
    });
  }

  resetForm(): void {
    this.product = { name: '', description: '', price: 0, stock: 0, imageUrl: '', category: '' };
    this.imageFile = null;
    this.imagePreview = null;
    this.imgSrc = null;
  }
}
