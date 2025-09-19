import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export type RecoItem = { productId: number | string; score: number };
export type RecoResponse = { items: RecoItem[] };

import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiRecoService {
  private base = environment.AI_BASE;

  constructor(private http: HttpClient) {}

  private disabled<T>(fallback: T) { return of(fallback); }
  private get on() { return !!this.base; }

  recommend(history: (string|number)[], k: number, userId?: number) {
    if (!this.on) return this.disabled<RecoResponse>({ items: [] });
    return this.http.post<RecoResponse>(`${this.base}/recommend`, { history, k, userId });
  }

  search(q: string, k = 6) {
    if (!this.on) return this.disabled<{items:any[]}>({ items: [] });
    return this.http.get<{items:any[]}>(`${this.base}/search`, { params: { q, k } });
  }

  similar(productId: number, k = 6) {
    if (!this.on) return this.disabled<{items:any[]}>({ items: [] });
    return this.http.get<{items:any[]}>(`${this.base}/similar`, { params: { product_id: productId, k } });
  }

  track(userId: number, productId: number, event: 'view'|'add_to_cart'|'purchase') {
    if (!this.on) return this.disabled({ ok: true });
    return this.http.post(`${this.base}/track`, { userId, productId, event });
  }

  reload() { return this.on ? this.http.post(`${this.base}/reload`, {}) : this.disabled({}); }
  health() { return this.on ? this.http.get(`${this.base}/health`) : this.disabled({ status: 'off' }); }
}
