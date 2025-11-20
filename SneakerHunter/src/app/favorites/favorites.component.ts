import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../services/favorite.service';
import { SneakerService } from '../services/sneaker.service';
import { CartService } from '../services/cart.service';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Sneaker } from '../models/sneaker';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favItems$: Observable<Sneaker[]>;

  constructor(
    private fav: FavoritesService,
    private sneakerService: SneakerService,
    private cart: CartService
  ) {
    // combina lista de IDs favoritos com lista de sneakers do serviço
    this.favItems$ = combineLatest([
      this.fav.favs$.pipe(startWith([])),
      this.sneakerService.sneakers$.pipe(startWith([]))
    ]).pipe(
      map(([ids, allSneakers]: [number[], Sneaker[]]) => {
        // valida arrays
        if (!Array.isArray(ids) || !Array.isArray(allSneakers)) {
          console.log('[FavoritesComponent] IDs ou Sneakers não são arrays:', { ids, allSneakers });
          return [];
        }
        // mapeia cada ID para o Sneaker correspondente
        const result = ids
          .map((id: number) => {
            const found = allSneakers.find((s: Sneaker) => s.id === id);
            return found;
          })
          .filter((s): s is Sneaker => !!s); // remove undefined
        console.log('[FavoritesComponent] Favoritos mapeados:', result);
        return result;
      })
    );
  }

  ngOnInit(): void {
    // força carregamento de sneakers ao iniciar
    (this.sneakerService as any).loadAll?.();
  }

  remove(id: number) {
    this.fav.toggleFavorite({ id } as Sneaker);
  }

  addToCart(s: Sneaker) {
    this.cart.addToCart(s, 1);
  }
}
