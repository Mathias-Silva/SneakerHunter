import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
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
  items$!: Observable<{ item?: Sneaker; qty: number; size?: number }[]>;
  total$!: Observable<number>;

  constructor(
    private cart: CartService,
    private sneakerService: SneakerService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cart.loadCartForUser().subscribe();

    const allSneakers$ = this.sneakerService.getAll();

    this.items$ = combineLatest([this.cart.items$, allSneakers$]).pipe(
      map(([items, allSneakers]) =>
        (items || []).map(i => ({
          item: allSneakers.find(s => String(s.id) === String(i.sneakerId)),
          qty: i.qty,
          size: i.size
        }))
      )
    );

    this.total$ = this.items$.pipe(
      map(list => (list || []).reduce((acc, e) => acc + ((e.item?.price || 0) * (e.qty || 0)), 0))
    );
  }

  setQty(id: any, qty: number, size?: number) {
    if (id == null) return;
    this.cart.updateQty(String(id), qty, size);
  }

  // Aumenta quantidade de um item no carrinho
  increase(e: any) {
    const id = e?.item?.id ?? e;
    this.cart.addToCart(id, 1, e.size);
  }

  decrease(e: any) {
    const id = e?.item?.id ?? e;
    this.cart.decreaseQty(String(id), 1, e.size);
  }

  remove(e: any) {
    const id = e?.item?.id ?? e;
    this.cart.removeFromCart(String(id), e.size);
  }

  clear() { this.cart.clear(); }
  buyAll() {
    // pega o total atual (um valor) e mostra no confirm com formatação BRL
    this.total$.pipe(take(1)).subscribe(total => {
      const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total || 0);
      if (!confirm(`Deseja realmente finalizar a compra no total de ${formatted}?`)) return;

      this.cart.placeOrder().subscribe({
        next: (order) => {
          if (!order) {
            alert('Carrinho vazio ou erro ao processar o pedido.');
            return;
          }
          alert('Compra realizada! Pedido salvo.');
        },
        error: () => {
          alert('Erro ao processar o pedido. Tente novamente.');
        }
      });
    });
  }
  get estaLogado(): boolean { return this.auth.isLoggedIn(); }
}
