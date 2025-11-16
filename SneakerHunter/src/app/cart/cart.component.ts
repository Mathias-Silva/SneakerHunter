import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  items$;
  total$;

  constructor(private cart: CartService) {
    // inicialize observables aqui (após injeção)
    this.items$ = this.cart.items$;
    this.total$ = this.cart.items$.pipe(
      map((list: any[]) => list.reduce((s, e) => s + ((e.item?.price || 0) * (e.qty || 0)), 0))
    );
  }

  remove(id: number) {
    this.cart.removeFromCart(id);
  }

  clear() {
    this.cart.clear();
  }
}
