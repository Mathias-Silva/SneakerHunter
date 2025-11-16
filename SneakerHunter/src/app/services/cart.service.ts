// ...existing code...
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sneaker } from '../models/sneaker';

type CartEntry = { item: Sneaker; qty: number };

@Injectable({ providedIn: 'root' })
export class CartService {
  private key = 'cart';
  private sub = new BehaviorSubject<CartEntry[]>(this.load());
  items$ = this.sub.asObservable();

  private load(): CartEntry[] {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  }

  private save(list: CartEntry[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
    this.sub.next(list);
  }

  addToCart(item: Sneaker, qty = 1) {
    const list = [...this.sub.value];
    const idx = list.findIndex(e => e.item.id === item.id);
    if (idx > -1) list[idx].qty += qty;
    else list.push({ item, qty });
    this.save(list);
  }

  removeFromCart(id: number) {
    const list = this.sub.value.filter(e => e.item.id !== id);
    this.save(list);
  }

  clear() { this.save([]); }

  count(): number { return this.sub.value.reduce((s, e) => s + e.qty, 0); }
}
// ...existing code...