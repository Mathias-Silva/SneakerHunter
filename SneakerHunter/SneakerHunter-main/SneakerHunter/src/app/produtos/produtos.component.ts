import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SneakerService } from '../services/sneaker.service';
import { Sneaker } from '../models/sneaker';
import { Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import { FavoritesService } from '../services/favorite.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.css']
})
export class ProdutosComponent implements OnInit, OnDestroy {
  sneakers: Sneaker[] = [];
  loading = false;
  error = '';
  private sub?: Subscription;
  erro = '';

  constructor(public sneakerService: SneakerService,
              private cartService: CartService,
              private favService: FavoritesService,
              private authService: AuthService,
              private router: Router) {} // mudei de private para public

  ngOnInit(): void {
    this.loading = true;
    console.log('[ProdutosComponent] Iniciando...');
    
    this.sub = this.sneakerService.sneakers$.subscribe({
      next: list => {
        console.log('[ProdutosComponent] Produtos atualizados:', list);
        this.sneakers = list;
        this.loading = false;
      },
      error: err => {
        console.error('[ProdutosComponent] Erro ao carregar:', err);
        this.error = 'Erro ao carregar produtos';
        this.loading = false;
      }
    });

    this.sneakerService.loadAll();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.sneakerService.loadAll();
  }

  addToCart(sneaker: Sneaker): void {
    this.cartService.addToCart(sneaker);
    console.log('[ProdutosComponent] Adicionado ao carrinho:', sneaker);
  }

  addToFavorites(sneaker: Sneaker): void {
    this.favService.toggle(sneaker);
    
  }

getAll(): string[] {
  return this.favService.getAll();
}
  isFavorited(s: Sneaker): boolean {
    return this.favService.isFavoriteId(s.id);
  }

  comprar(produto: any) {
    if (!this.authService.isLoggedIn()) {
      this.erro = 'Você precisa estar logado para comprar!';
      return;
    }
    // Adicione ao carrinho ou prossiga com a compra
    // Exemplo:
    // this.cartService.addToCart(produto);
    // this.router.navigate(['/cart']);
  }
}