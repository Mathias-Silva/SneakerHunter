import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Sneaker } from '../models/sneaker';

@Injectable({ providedIn: 'root' })
export class SneakerService {
  private api = 'http://localhost:3000';
  private subject = new BehaviorSubject<Sneaker[]>([]);
  sneakers$ = this.subject.asObservable();

  constructor(private http: HttpClient) {}

  // Carrega todos do backend e atualiza sneakers$
  loadAll(): void {
    this.http.get<Sneaker[]>(`${this.api}/sneakers`).pipe(
      tap(list => this.subject.next(list || []))
    ).subscribe({
      error: err => console.error('[SneakerService] loadAll error', err)
    });
  }

  getAll(): Observable<Sneaker[]> {
    if (!this.subject.value || this.subject.value.length === 0) {
      this.loadAll();
    }
    return this.sneakers$;
  }

  getById(id: string): Observable<Sneaker | undefined> {
    return this.http.get<Sneaker[]>(`${this.api}/sneakers?id=${encodeURIComponent(id)}`).pipe(
      map(list => (list && list.length) ? list[0] : undefined)
    );
  }

  createSneaker(s: Sneaker): Observable<Sneaker> {
    return this.http.post<Sneaker>(`${this.api}/sneakers`, s).pipe(
      tap(() => this.loadAll())
    );
  }

  updateSneaker(id: string, payload: Partial<Sneaker>): Observable<Sneaker> {
    return this.http.patch<Sneaker>(`${this.api}/sneakers/${encodeURIComponent(id)}`, payload).pipe(
      tap(() => this.loadAll())
    );
  }

  deleteSneaker(id: string): Observable<any> {
    return this.http.delete(`${this.api}/sneakers/${encodeURIComponent(id)}`).pipe(
      tap(() => this.loadAll())
    );
  }
}