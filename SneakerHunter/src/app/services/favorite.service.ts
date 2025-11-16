// ...existing code...
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sneaker } from '../models/sneaker';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private key = 'favorites';
  private sub = new BehaviorSubject<number[]>(this.load());
  favs$ = this.sub.asObservable();

  private load(): number[] {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  }

  private save(list: number[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
    this.sub.next(list);
  }

  toggleFavorite(s: Sneaker) {
    const id = s.id;
    const list = [...this.sub.value];
    const i = list.indexOf(id);
    if (i > -1) list.splice(i, 1);
    else list.push(id);
    this.save(list);
  }

  isFavoriteId(id: number): boolean { return this.sub.value.includes(id); }

  getAll(): number[] { return [...this.sub.value]; }
}
// ...existing code...