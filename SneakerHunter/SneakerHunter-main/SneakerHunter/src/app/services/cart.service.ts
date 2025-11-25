import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface CartItem { sneakerId: string; qty: number; size?: number; }
interface CartRecord { id?: number; userId?: number | null; items: CartItem[]; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = 'http://localhost:3000';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();
  private loaded = new Set<number | null | string>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  // retorna userId (ou null se deslogado)
  private getUserId(): number | null {
    return this.auth.getCurrentUser()?.id ?? null;
  }

  private qFor(userId: number | null) {
    return userId ? `userId=${userId}` : 'userId=null';
  }

  loadCartForUser(userId?: number | null): Observable<CartItem[]> {
    const uid = userId ?? this.getUserId();
    if (this.loaded.has(uid)) return of(this.itemsSubject.value);

    const q = this.qFor(uid);
    return this.http.get<CartRecord[]>(`${this.api}/carts?${q}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const items = list[0].items || [];
          this.itemsSubject.next(items);
          this.loaded.add(uid);
          return of(items);
        } else {
          const payload: CartRecord = { userId: uid, items: [] };
          return this.http.post<CartRecord>(`${this.api}/carts`, payload).pipe(
            tap(rec => { this.itemsSubject.next(rec.items || []); this.loaded.add(uid); }),
            map(rec => rec.items || [])
          );
        }
      })
    );
  }

  addToCart(itemOrId: any, qty = 1, size?: number): void {
    const uid = this.getUserId();
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    const q = this.qFor(uid);

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
          const payload: CartRecord = { userId: uid, items: [{ sneakerId, qty, ...(size != null ? { size } : {}) }] };
          return this.http.post<CartRecord>(`${this.api}/carts`, payload).pipe(
            tap(rec => this.itemsSubject.next(rec.items || []))
          );
        }
      })
    ).subscribe();
  }

  decreaseQty(itemOrId: any, qty = 1, size?: number): void {
    const uid = this.getUserId();
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
    const uid = this.getUserId();
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
    const uid = this.getUserId();
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
    const uid = this.getUserId();
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

  // merge guest (userId: null) cart into logged-in user cart
  mergeSessionIntoUser(userId: number): void {
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=null`).pipe(
      switchMap(guestList => {
        if (!guestList || !guestList.length) return of(null);
        const guest = guestList[0];
        return this.http.get<CartRecord[]>(`${this.api}/carts?userId=${userId}`).pipe(
          switchMap(userList => {
            if (userList && userList.length) {
              const userRec = userList[0];
              const combined = [...(userRec.items || [])];
              for (const it of (guest.items || [])) {
                const idx = combined.findIndex(x => x.sneakerId === it.sneakerId && (x.size ?? null) === (it.size ?? null));
                if (idx > -1) combined[idx].qty += it.qty;
                else combined.push({ sneakerId: it.sneakerId, qty: it.qty, ...(it.size != null ? { size: it.size } : {}) });
              }
              return this.http.patch(`${this.api}/carts/${userRec.id}`, { items: combined }).pipe(
                switchMap(() => this.http.delete(`${this.api}/carts/${guest.id}`)),
                tap(() => { this.itemsSubject.next(combined); this.loaded.delete(null); this.loaded.delete(userId); })
              );
            } else {
              const payload = { userId, items: guest.items || [] };
              return this.http.post(`${this.api}/carts`, payload).pipe(
                switchMap(() => this.http.delete(`${this.api}/carts/${guest.id}`)),
                tap(() => { this.itemsSubject.next(guest.items || []); this.loaded.delete(null); this.loaded.delete(userId); })
              );
            }
          })
        );
      })
    ).subscribe();
  }
}