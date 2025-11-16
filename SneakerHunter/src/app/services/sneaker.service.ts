// src/app/services/sneaker.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Sneaker } from '../models/sneaker';

@Injectable({
  providedIn: 'root'
})
export class SneakerService {
  private apiUrl = 'http://localhost:3000/sneakers';
  private sneakersSubject = new BehaviorSubject<Sneaker[]>([]);
  sneakers$ = this.sneakersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAll();
  }

  // carrega todos os tênis do backend e atualiza o subject
  loadAll(): void {
    this.http.get<Sneaker[]>(this.apiUrl).subscribe({
      next: list => {
        console.log('[SneakerService] Loaded from db.json:', list);
        this.sneakersSubject.next(list || []);
      },
      error: err => {
        console.error('[SneakerService] loadAll error:', err);
        this.sneakersSubject.next([]);
      }
    });
  }

  getSneakers(): Observable<Sneaker[]> {
    return this.http.get<Sneaker[]>(this.apiUrl);
  }

  getSneaker(id: number): Observable<Sneaker> {
    return this.http.get<Sneaker>(`${this.apiUrl}/${id}`);
  }

  createSneaker(sneaker: Sneaker): Observable<Sneaker> {
    const payload: any = { ...sneaker };
    // json-server gera o id, não envie id=0
    delete payload.id;
    return this.http.post<Sneaker>(this.apiUrl, payload).pipe(
      tap(created => {
        console.log('[SneakerService] Created:', created);
        // recarrega para garantir sincronização com backend
        this.loadAll();
      })
    );
  }

  updateSneaker(id: number, sneaker: Sneaker): Observable<Sneaker> {
    if (!id || id === 0) {
      throw new Error('updateSneaker: invalid id');
    }
    return this.http.put<Sneaker>(`${this.apiUrl}/${id}`, sneaker).pipe(
      tap(updated => {
        console.log('[SneakerService] Updated:', updated);
        this.loadAll();
      })
    );
  }

  deleteSneaker(id: number): Observable<void> {
    if (!id || id === 0) {
      throw new Error('deleteSneaker: invalid id');
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('[SneakerService] Deleted id:', id);
        this.loadAll();
      })
    );
  }
}