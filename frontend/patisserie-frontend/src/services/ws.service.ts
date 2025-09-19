// src/services/ws.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment'; // OK avec tsconfig "baseUrl":"./src"

@Injectable({ providedIn: 'root' })
export class WsService implements OnDestroy {
  private client?: Client;
  private connected = false;

  private connection$ = new Subject<boolean>();
  connectionChanges$ = this.connection$.asObservable();

  connect(): void {
    if (this.connected) return;

    this.client = Stomp.over(() => new (SockJS as any)(environment.WS_ENDPOINT));
    // this.client.debug = (msg) => console.log('[STOMP]', msg);

    this.client.onConnect = () => {
      this.connected = true;
      this.connection$.next(true);
      console.log('[WS] connected');
    };

    this.client.onStompError = (frame) => {
      console.error('[WS] broker error', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      this.connection$.next(false);
      console.warn('[WS] closed, retrying...');
      setTimeout(() => this.connect(), 3000);
    };

    this.client.activate();
  }

  subscribe<T = any>(destination: string): Observable<T> {
    const out$ = new Subject<T>();

    const doSub = () => {
      this.client?.subscribe(destination, (message: IMessage) => {
        try {
          out$.next(JSON.parse(message.body) as T);
        } catch {
          out$.next((message.body as unknown) as T);
        }
      });
    };

    if (this.connected) {
      doSub();
    } else {
      const sub = this.connectionChanges$.subscribe((ok: boolean) => {
        if (ok) {
          doSub();
          sub.unsubscribe();
        }
      });
    }
    return out$.asObservable();
  }

  publish(destination: string, body: any): void {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    (this.client as any)?.publish({ destination, body: payload });
  }

  ngOnDestroy(): void {
    this.client?.deactivate();
  }
}
