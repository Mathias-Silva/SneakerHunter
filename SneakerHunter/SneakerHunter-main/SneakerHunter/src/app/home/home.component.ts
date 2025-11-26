import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SneakerService } from '../services/sneaker.service';
import { FavoritesService } from '../services/favorite.service';
import { CartService } from '../services/cart.service';
import { Sneaker } from '../models/sneaker';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  sneakers$!: Observable<Sneaker[]>;
  sneakers: Sneaker[] = [];
  filteredSneakers: Sneaker[] = [];
  loading = false;
  error: string | null = null;
  erro: string | null = null;
  searchTerm = '';
  selectedGender = 'todos';
  brands: string[] = [];
  selectedBrands: string[] = [];


  selectedSizes: { [id: string]: number | null } = {};

  constructor(
    private sneakerService: SneakerService,
    public fav: FavoritesService,
    private cart: CartService
  ) {}

  //inicializa o carregamento dos produtos
  ngOnInit(): void {
    this.loading = true;
    this.sneakers$ = this.sneakerService.getAll();
    this.sneakers$.subscribe({
      next: (list: Sneaker[]) => {
        this.sneakers = list || [];
        this.brands = Array.from(new Set((this.sneakers || []).map(s => (s.brand || '').toString()).filter(Boolean)));
        this.applyFilters();
        
        for (const s of this.sneakers) {
          const id = String(s.id ?? '');
          this.selectedSizes[id] = (s.sizes && s.sizes.length) ? s.sizes[0] : null;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('[HomeComponent] load error', err);
        this.error = 'Erro ao carregar produtos';
        this.erro = this.error;
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.sneakers];

    const q = (this.searchTerm || '').trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.brand || '').toLowerCase().includes(q)
      );
    }

    if (this.selectedGender && this.selectedGender !== 'todos') {
      filtered = filtered.filter(s => String(s.gender || '').toLowerCase() === String(this.selectedGender).toLowerCase());
    }

    if (this.selectedBrands && this.selectedBrands.length) {
      filtered = filtered.filter(s => this.selectedBrands.includes((s.brand || '').toString()));
    }

    this.filteredSneakers = filtered;
  }

  onSearchChange() { this.applyFilters(); }
  onGenderChange(g: string) { this.selectedGender = g; this.applyFilters(); }

  clearFilters() {
    this.searchTerm = '';
    this.selectedGender = 'todos';
    this.selectedBrands = [];
    this.applyFilters();
  }

  isBrandSelected(b: string) { return this.selectedBrands.includes(b); }

  toggleBrand(b: string) {
    const i = this.selectedBrands.indexOf(b);
    if (i === -1) this.selectedBrands.push(b); else this.selectedBrands.splice(i, 1);
    this.applyFilters();
  }

  
  selectSize(s: Sneaker, size: number) {
    if (!s?.id) return;
    this.selectedSizes[String(s.id)] = size;
  }
  
  isSelectedSize(s: Sneaker, size: number): boolean {
    return String(this.selectedSizes[String(s.id)]) === String(size);
  }

  addToFavorites(s: Sneaker) { this.fav.toggle(s); }

  // add to cart passes selected size (may be null)
  addToCart(s: Sneaker) {
    const id = String(s.id ?? '');
    const size = this.selectedSizes[id] ?? undefined;
    this.cart.addToCart(s, 1, size);
  }

  isFavorited(s: Sneaker) { return this.fav.isFavorite(s.id); }
}
