import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface CartRecord { id?: number; userId: number; items: { sneakerId: string; qty: number }[]; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = 'http://localhost:3000';
  private itemsSubject = new BehaviorSubject<{ sneakerId: string; qty: number }[]>([]);
  items$ = this.itemsSubject.asObservable();

  private loadedFor = new Set<number>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  loadCartForUser(userId?: number): Observable<{ sneakerId: string; qty: number }[]> {
    const uid = userId ?? this.auth.getCurrentUser()?.id;
    if (!uid) { this.itemsSubject.next([]); return of([]); }
    if (this.loadedFor.has(uid)) return of(this.itemsSubject.value);

    return this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const items = list[0].items || [];
          this.itemsSubject.next(items);
          this.loadedFor.add(uid);
          return of(items);
        } else {
          const newRec: CartRecord = { userId: uid, items: [] };
          return this.http.post<CartRecord>(`${this.api}/carts`, newRec).pipe(
            tap(rec => {
              this.itemsSubject.next(rec.items || []);
              this.loadedFor.add(uid);
            }),
            map(rec => rec.items || [])
          );
        }
      })
    );
  }

  addToCart(itemOrId: any, qty = 1): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return;
    const sneakerId = String(itemOrId?.id ?? itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const rec = list[0];
          const items = rec.items || [];
          const idx = items.findIndex(i => i.sneakerId === sneakerId);
          if (idx > -1) items[idx].qty += qty;
          else items.push({ sneakerId, qty });
          return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
            tap(() => this.itemsSubject.next(items))
          );
        } else {
          const newRec: CartRecord = { userId: uid, items: [{ sneakerId, qty }] };
          return this.http.post<CartRecord>(`${this.api}/carts`, newRec).pipe(
            tap(rec => this.itemsSubject.next(rec.items || []))
          );
        }
      })
    ).subscribe();
  }

  decreaseQty(itemOrId: any, qty = 1): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return;
    const sneakerId = String(itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).map(i => ({ ...i }));
        const idx = items.findIndex(i => i.sneakerId === sneakerId);
        if (idx === -1) return of(null as any);
        items[idx].qty = Math.max(0, (items[idx].qty || 0) - qty);
        if (items[idx].qty === 0) items.splice(idx, 1);
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  updateQty(itemOrId: any, qty: number): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return;
    const sneakerId = String(itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).map(i => ({ ...i }));
        const idx = items.findIndex(i => i.sneakerId === sneakerId);
        if (idx === -1) return of(null as any);
        items[idx].qty = Math.max(1, qty);
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  removeFromCart(itemOrId: any): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return;
    const sneakerId = String(itemOrId);
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        const items = (rec.items || []).filter(i => i.sneakerId !== sneakerId);
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items }).pipe(
          tap(() => this.itemsSubject.next(items))
        );
      })
    ).subscribe();
  }

  clear(): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return;
    this.http.get<CartRecord[]>(`${this.api}/carts?userId=${uid}`).pipe(
      switchMap(list => {
        if (!list || !list.length) return of(null as any);
        const rec = list[0];
        return this.http.patch(`${this.api}/carts/${rec.id}`, { items: [] }).pipe(
          tap(() => this.itemsSubject.next([]))
        );
      })
    ).subscribe();
  }

  mergeSessionIntoUser(userId: number): void {
    return;
  }
}