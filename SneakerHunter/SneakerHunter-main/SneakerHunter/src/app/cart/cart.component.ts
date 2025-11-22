import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { CartService } from '../services/cart.service';
import { SneakerService } from '../services/sneaker.service';
import { AuthService } from '../services/auth.service';
import { Sneaker } from '../models/sneaker';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  // items$ corresponde ao que o template espera (lista enriquecida com objeto do produto)
  items$!: Observable<{ item?: Sneaker; qty: number }[]>;
  total$!: Observable<number>;

  constructor(
    private cart: CartService,
    private sneakerService: SneakerService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    // carrega registro (usa session ou usuário logado internamente)
    this.cart.loadCartForUser().subscribe();

    const allSneakers$ = this.sneakerService.getAll();

    this.items$ = combineLatest([this.cart.items$, allSneakers$]).pipe(
      map(([items, allSneakers]) =>
        (items || []).map(i => ({
          item: allSneakers.find(s => String(s.id) === String(i.sneakerId)),
          qty: i.qty
        }))
      )
    );

    this.total$ = this.items$.pipe(
      map(list => (list || []).reduce((acc, e) => acc + ((e.item?.price || 0) * (e.qty || 0)), 0))
    );
  }

  // métodos usados no template
  setQty(id: any, qty: number) {
    if (id == null) return;
    this.cart.updateQty(String(id), Number(qty));
  }

  increase(e: any) {
    const id = e?.item?.id ?? e?.item?.sneakerId ?? e;
    this.cart.addToCart(String(id), 1);
  }

  decrease(e: any) {
    const id = e?.item?.id ?? e?.item?.sneakerId ?? e;
    this.cart.decreaseQty(String(id), 1);
  }

  remove(e: any) {
    const id = e?.item?.id ?? e?.item?.sneakerId ?? e;
    this.cart.removeFromCart(String(id));
  }

  clear() {
    this.cart.clear();
  }

  comprarTodos() {
    if (!confirm('Deseja realmente finalizar a compra?')) return;
    this.cart.clear();
    alert('Compra realizada com sucesso!');
  }

  // propriedade usada pelo template
  get estaLogado(): boolean {
    return this.auth.isLoggedIn();
  }
}
