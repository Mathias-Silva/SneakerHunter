// import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { SneakerService } from '../services/sneaker.service';
// import { Sneaker } from '../models/sneaker';
// import { Subscription } from 'rxjs';
// import { CartService } from '../services/cart.service';
// import { FavoritesService } from '../services/favorite.service';
// import { AuthService } from '../services/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-produtos',
//   standalone: true,
//   imports: [CommonModule, IonicModule],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   templateUrl: './produtos.component.html',
//   styleUrls: ['./produtos.component.css']
// })
// export class ProdutosComponent implements OnInit, OnDestroy {
//   sneakers: Sneaker[] = [];
//   loading = false;
//   error = '';
//   private sub?: Subscription;
//   erro = '';
//   selectedSizes: { [key: string]: number | null } = {};

//   constructor(public sneakerService: SneakerService,
//               private cartService: CartService,
//               private favService: FavoritesService,
//               private authService: AuthService,
//               private router: Router) {} 

//   ngOnInit(): void {
//     this.loading = true;
//     this.sneakerService.getAll().subscribe({
//       next: list => {
//         this.sneakers = list || [];
//         for (const s of this.sneakers) {
//           const id = String(s.id ?? '');
//           this.selectedSizes[id] = null;
//         }
//         this.loading = false;
//       },
//       error: err => {
//         console.error('[Produtos] load error', err);
//         this.erro = 'Erro ao carregar produtos';
//         this.error = this.erro;
//         this.loading = false;
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.sub?.unsubscribe();
//   }

//   reload(): void {
//     this.loading = true;
//     this.error = '';
//     this.sneakerService.loadAll();
//   }

//   addToCart(s: Sneaker) {
//     if (!s?.id) return;
//     const id = String(s.id ?? '');
//     const available = s.sizes && s.sizes.length;
//     const selected = this.selectedSizes[id];

//     if (available && (selected == null || selected === undefined)) {
//       const list = s.sizes!.join(', ');
//       const input = window.prompt(`Selecione o tamanho para "${s.name}"\nOpções: ${list}`, '');
//       if (!input) {
//         alert('Operação cancelada. Selecione um tamanho.');
//         return;
//       }
//       const chosen = Number(input);
//       if (!s.sizes!.includes(chosen)) {
//         alert('Tamanho inválido. Operação cancelada.');
//         return;
//       }
//       this.selectedSizes[id] = chosen;
//       this.cartService.addToCart(s, 1, chosen);
//       return;
//     }

//     const size = selected ?? undefined;
//     this.cartService.addToCart(s, 1, size);
//   }

//   addToFavorites(sneaker: Sneaker): void {
//     this.favService.toggle(sneaker);
    
//   }

// getAll(): string[] {
//   return this.favService.getAll();
// }
//   isFavorited(s: Sneaker): boolean {
//     return this.favService.isFavoriteId(s.id);
//   }

//   comprar(produto: any) {
//     if (!this.authService.isLoggedIn()) {
//       this.erro = 'Você precisa estar logado para comprar!';
//       return;
//     }
   
//   }
// }