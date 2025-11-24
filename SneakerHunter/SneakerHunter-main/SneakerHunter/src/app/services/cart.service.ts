import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface CartItem { sneakerId: string; qty: number; size?: number; }
interface CartRecord { id?: number; userId?: number; sessionId?: string; items: CartItem[]; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = 'http://localhost:3000';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();
  private loaded = new Set<string>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  // local session id management (no SessionService required)
  private getSessionId(): string {
    const key = 'sneaker_session';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = this.uuidv4();
      localStorage.setItem(key, sid);
    }
    return sid;
  }

  private uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private qFor(userId?: number) {
    const sid = this.getSessionId();
    return userId ? `userId=${userId}` : `sessionId=${encodeURIComponent(sid)}`;
  }

  loadCartForUser(userId?: number): Observable<CartItem[]> {
    const uid = userId ?? this.auth.getCurrentUser()?.id;
    const key = uid ? `u:${uid}` : `s:${this.getSessionId()}`;
    if (this.loaded.has(key)) return of(this.itemsSubject.value);

    const q = this.qFor(uid);
    return this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const items = list[0].items || [];
          this.itemsSubject.next(items);
          this.loaded.add(key);
          return of(items);
        } else {
          const payload: any = uid ? { userId: uid, items: [] } : { sessionId: this.getSessionId(), items: [] };
          return this.http.post<CartRecord>(`${this.api}/carts`, payload).pipe(
            tap(rec => { this.itemsSubject.next(rec.items || []); this.loaded.add(key); }),
            map(rec => rec.items || [])
          );
        }
      })
    );
  }

  addToCart(itemOrId: any, qty = 1, size?: number): void {
    const uid = this.auth.getCurrentUser()?.id;
    const sid = this.getSessionId();
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    const q = uid ? `userId=${uid}` : `sessionId=${encodeURIComponent(sid)}`;

    this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const rec = list[0];
          const items: CartItem[] = rec.items || [];
          const idx = items.findIndex(i => i.sneakerId === sneakerId && (i.size ?? null) === (size ?? null));
          if (idx > -1) items[idx].qty += qty;
          else items.push({ sneakerId, qty, ...(size != null ? { size } : {}) });
          return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
            tap(() => this.itemsSubject.next(items))
          );
        } else {
          const payload: any = uid
            ? { userId: uid, items: [{ sneakerId, qty, ...(size != null ? { size } : {}) }] }
            : { sessionId: sid, items: [{ sneakerId, qty, ...(size != null ? { size } : {}) }] };
          return this.http.post<CartRecord>(`${this.api}/carts`, payload).pipe(
            tap(rec => this.itemsSubject.next(rec.items || []))
          );
        }
      })
    ).subscribe();
  }

  decreaseQty(itemOrId: any, qty = 1, size?: number): void {
    const uid = this.auth.getCurrentUser()?.id;
    const q = this.qFor(uid);
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).map(i => ({ ...i }));
        const idx = items.findIndex(i => i.sneakerId === sneakerId && (i.size ?? null) === (size ?? null));
        if (idx === -1) return of(null as any);
        items[idx].qty = Math.max(0, (items[idx].qty || 0) - qty);
        if (items[idx].qty === 0) items.splice(idx, 1);
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  updateQty(itemOrId: any, qty: number, size?: number): void {
    const uid = this.auth.getCurrentUser()?.id;
    const q = this.qFor(uid);
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).map(i => ({ ...i }));
        const idx = items.findIndex(i => i.sneakerId === sneakerId && (i.size ?? null) === (size ?? null));
        if (idx === -1) return of(null as any);
        items[idx].qty = Math.max(1, qty);
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  removeFromCart(itemOrId: any, size?: number): void {
    const uid = this.auth.getCurrentUser()?.id;
    const q = this.qFor(uid);
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).filter(i => !(i.sneakerId === sneakerId && (i.size ?? null) === (size ?? null)));
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  clear(): void {
    const uid = this.auth.getCurrentUser()?.id;
    const q = this.qFor(uid);
    this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items: [] }).pipe(
          tap(() => this.itemsSubject.next([]))
        );
      })
    ).subscribe();
  }

  // merge guest session cart into user cart (uses localStorage sessionId)
  mergeSessionIntoUser(userId: number): void {
    const sid = this.getSessionId();
    this.http.get<CartRecord[]>(`${this.api}/carts?sessionId=${encodeURIComponent(sid)}`).pipe(
      switchMap(sessionList => {
        if (!sessionList || !sessionList.length) return of(null);
        const sess = sessionList[0];
        return this.http.get<CartRecord[]>(`${this.api}/carts?userId=${userId}`).pipe(
          switchMap(userList => {
            if (userList && userList.length) {
              const userRec = userList[0];
              const combined = [...(userRec.items || [])];
              for (const it of (sess.items || [])) {
                const idx = combined.findIndex(x => x.sneakerId === it.sneakerId && (x.size ?? null) === (it.size ?? null));
                if (idx > -1) combined[idx].qty += it.qty;
                else combined.push({ sneakerId: it.sneakerId, qty: it.qty, ...(it.size != null ? { size: it.size } : {}) });
              }
              return this.http.patch(`${this.api}/carts/${userRec.id}`, { items: combined }).pipe(
                switchMap(() => this.http.delete(`${this.api}/carts/${sess.id}`)),
                tap(() => this.itemsSubject.next(combined))
              );
            } else {
              const payload = { userId, items: sess.items || [] };
              return this.http.post(`${this.api}/carts`, payload).pipe(
                switchMap(() => this.http.delete(`${this.api}/carts/${sess.id}`)),
                tap(() => this.itemsSubject.next(sess.items || []))
              );
            }
          })
        );
      })
    ).subscribe();
  }
}