import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Sneaker } from '../models/sneaker';
import { SneakerService } from '../services/sneaker.service';
import { CartService } from '../services/cart.service';
import { FavoritesService } from '../services/favorite.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  sneakers: Sneaker[] = [];
  loading = false;
  error: string | null = null;

  // filter state
  searchTerm = '';
  selectedGender = 'todos';
  selectedBrands: string[] = [];
  brands: string[] = [];

  // observables for header badges
  cartCount$;
  favCount$;

  // preview state
  selectedSneaker: Sneaker | null = null;
  showPreview = false;

  constructor(
    private sneakerService: SneakerService,
    private cart: CartService,
    private fav: FavoritesService
  ) {
    this.cartCount$ = this.cart.items$.pipe(
      map((list: any[]) => list.reduce((s, e) => s + (e.qty || 0), 0))
    );

    this.favCount$ = this.fav.favs$.pipe(
      map((list: number[]) => list.length)
    );
  }

  ngOnInit(): void {
    // subscrever direto ao Observable do SneakerService (já carrega automaticamente)
    this.sneakerService.sneakers$.subscribe({
      next: (list: Sneaker[]) => this.onLoadSuccess(list),
      error: (err) => {
        console.error('[HomeComponent] Erro ao carregar sneakers:', err);
        this.error = 'Erro ao carregar produtos';
        this.loading = false;
      }
    });
  }

  private onLoadSuccess(list: Sneaker[]) {
    this.sneakers = list || [];
    this.brands = Array.from(new Set(this.sneakers.map(s => s.brand ?? '').filter(b => b !== '')));
    this.loading = false;
  }

  // template helpers / actions
  clearFilters() {
    this.searchTerm = '';
    this.selectedGender = 'todos';
    this.selectedBrands = [];
  }

  onSearchChange() { }

  onGenderChange(g: string) {
    this.selectedGender = g;
  }

  isBrandSelected(brand: string) {
    return this.selectedBrands.includes(brand);
  }

  toggleBrand(brand: string) {
    const i = this.selectedBrands.indexOf(brand);
    if (i > -1) this.selectedBrands.splice(i, 1);
    else this.selectedBrands.push(brand);
  }

  reload() {
    this.loading = true;
    this.sneakerService.loadAll();
  }

  get filteredSneakers(): Sneaker[] {
    let filtered = [...this.sneakers];
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(term) ||
        (s.brand || '').toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedGender && this.selectedGender !== 'todos') {
      filtered = filtered.filter(s => (s.gender || 'unissex') === this.selectedGender || s.gender === 'unissex');
    }

    if (this.selectedBrands.length > 0) {
      filtered = filtered.filter(s => this.selectedBrands.includes(s.brand || ''));
    }

    return filtered;
  }

  addToCart(s: Sneaker) { this.cart.addToCart(s); }
  addToFavorites(s: Sneaker) { this.fav.toggleFavorite(s); }
  toggleFavorite(s: Sneaker) { this.fav.toggleFavorite(s); }
  isFavorited(s: Sneaker): boolean { return this.fav.isFavoriteId(s.id); }

  openPreview(s: Sneaker) {
    this.selectedSneaker = s;
    this.showPreview = true;
    document.body.style.overflow = 'hidden';
  }

  closePreview() {
    this.selectedSneaker = null;
    this.showPreview = false;
    document.body.style.overflow = '';
  }
}
