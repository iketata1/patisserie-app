import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AiRecoService } from 'src/services/ai-reco.service';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/services/product.service';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-reco-strip',
  templateUrl: './reco-strip.component.html',
  styleUrls: ['./reco-strip.component.css']
})
export class RecoStripComponent implements OnInit, OnChanges {
  /** IDs produits issus de l’historique (ex: commandes) */
  @Input() historyIds: number[] = [];

  loading = false;
  error = '';
  products: Product[] = [];

  constructor(
    private ai: AiRecoService,
    public productService: ProductService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // on tente déjà au cas où l’input est déjà présent
    this.fetch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['historyIds']) {
      // l’input vient d’être rempli depuis le parent (après l’appel async) -> relance
      this.fetch();
    }
  }

  private fetch(): void {
    // autoriser le "cold start": même si historyIds est vide, on appelle l’API
    const userId = (this.auth as any).getUserId?.() ?? undefined;
    const history = (this.historyIds || []).map(String);

    this.loading = true;
    this.error = '';
    this.products = [];

    console.log('[reco-strip] fetch, historyIds=', this.historyIds);

    this.ai.recommend(history, 6, userId).subscribe({
      next: async (res) => {
        const ids = (res?.items || []).map(i => Number(i.productId));
        if (!ids.length) {
          this.loading = false;
          this.error = 'Aucune recommandation disponible.';
          return;
        }

        // récupère le catalogue puis filtre par IDs recommandés
        try {
          const all = await this.productService.getProducts().toPromise();
          const wanted = new Set(ids);
          this.products = (all || []).filter(p => p.id != null && wanted.has(p.id!));
          this.loading = false;
        } catch (e) {
          console.error(e);
          this.loading = false;
          this.error = 'Impossible de charger les produits recommandés.';
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.error = 'Service de recommandations indisponible.';
      }
    });
  }
}
