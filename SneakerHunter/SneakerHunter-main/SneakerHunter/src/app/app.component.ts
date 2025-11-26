import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { FavoritesService } from './services/favorite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
  // Observables usados na UI para exibir contadores e total do carrinho
  cartCount$;
  cartTotal$;
  favCount$;

  constructor(private cart: CartService, private fav: FavoritesService) {
    this.cartCount$ = this.cart.items$.pipe(
      map((list: any[]) => list.reduce((s, e) => s + (e.qty || 0), 0))
    );

    this.cartTotal$ = this.cart.items$.pipe(
      map((list: any[]) => list.reduce((s, e) => s + ((e.item?.price || 0) * (e.qty || 0)), 0).toFixed(2))
    );

    this.favCount$ = this.fav.items$.pipe(
      map((list: string[]) => list.length)
    );
  }

  ngOnInit() { }
}