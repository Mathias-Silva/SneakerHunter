import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { FavoritesService } from '../services/favorite.service';
import { SneakerService } from '../services/sneaker.service';
import { CartService } from '../services/cart.service';
import { Sneaker } from '../models/sneaker';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favItems$!: Observable<Sneaker[]>;

  constructor(
    public fav: FavoritesService,
    private sneakerService: SneakerService,
    private cart: CartService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.fav.loadForUser().subscribe();

    const allSneakers$ = this.sneakerService.getAll();

    this.favItems$ = combineLatest([this.fav.items$, allSneakers$]).pipe(
      map(([ids, allSneakers]: [string[], Sneaker[]]) =>
        ids
          .map(id => allSneakers.find(s => String(s.id) === String(id)))
          .filter(Boolean) as Sneaker[]
      )
    );
  }

  addToCart(s: Sneaker) { this.cart.addToCart(s, 1); }
  toggleFavorite(s: Sneaker) { this.fav.toggle(s.id); }
}
