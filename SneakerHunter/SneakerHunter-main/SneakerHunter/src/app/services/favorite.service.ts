import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private api = 'http://localhost:3000';
  private sub = new BehaviorSubject<string[]>([]);
  items$ = this.sub.asObservable();

  private loadedFor = new Set<number>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  loadForUser(userId?: number): Observable<string[]> {
    const uid = userId ?? this.auth.getCurrentUser()?.id;
    if (!uid) { this.sub.next([]); return of([]); }
    if (this.loadedFor.has(uid)) return of(this.sub.value);

    return this.http.get<any[]>(`${this.api}/favorites?userId=${uid}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const items: string[] = (list[0].items || []).map(String);
          this.sub.next(items);
          this.loadedFor.add(uid);
          return of(items);
        } else {
          return this.http.post<any>(`${this.api}/favorites`, { userId: uid, items: [] }).pipe(
            tap(rec => {
              this.sub.next(rec.items || []);
              this.loadedFor.add(uid);
            }),
            map(rec => (rec.items || []).map(String))
          );
        }
      })
    );
  }

  toggle(itemOrId: any): void {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return; 
    const id = String(itemOrId?.id ?? itemOrId);
    this.http.get<any[]>(`${this.api}/favorites?userId=${uid}`).pipe(
      switchMap(list => {
        if (list && list.length) {
          const rec = list[0];
          const items: string[] = Array.isArray(rec.items) ? rec.items.map(String) : [];
          const idx = items.indexOf(id);
          if (idx > -1) items.splice(idx, 1); else items.push(id);
          return this.http.patch(`${this.api}/favorites/${rec.id}`, { items }).pipe(
            tap(() => this.sub.next(items)),
            map(() => items)
          );
        } else {
          const items = [id];
          return this.http.post(`${this.api}/favorites`, { userId: uid, items }).pipe(
            tap(() => this.sub.next(items)),
            map(() => items)
          );
        }
      })
    ).subscribe();
  }

  isFavorite(id: any): boolean {
    return this.sub.value.includes(String(id));
  }

  isFavoriteId(id: any): boolean { return this.isFavorite(id); }
  getAll(): string[] { return this.sub.value; }

  mergeSessionIntoUser(userId: number): void {
    return;
  }
}