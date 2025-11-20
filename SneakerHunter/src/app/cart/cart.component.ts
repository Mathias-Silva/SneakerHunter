import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Sneaker } from '../models/sneaker';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  items$!: Observable<any[]>;
  total$!: Observable<number>;
  isAdmin$!: Observable<boolean>;

  constructor(private cart: CartService, private auth: AuthService) {
    // inicialize observables somente após injeção dos serviços
    this.items$ = this.cart.items$;
    this.total$ = this.cart.items$.pipe(
      map((list: any[]) => Array.isArray(list) ? list.reduce((s, e) => s + ((e.item?.price || 0) * (e.qty || 0)), 0) : 0)
    );

    this.isAdmin$ = (this.auth as any).isAdmin$ ?? of(!!((this.auth as any).isAdmin ? (this.auth as any).isAdmin() : false));
  }

  ngOnInit(): void {}

  increase(item: Sneaker) {
    this.cart.addToCart(item, 1);
  }

  decrease(id: number) {
    this.cart.decreaseQty(id, 1);
  }

  setQty(id: number, qty: number) {
    this.cart.updateQty(id, qty);
  }

  remove(id: number) {
    this.cart.removeFromCart(id);
  }

  clear() {
    this.cart.clear();
  }
}
