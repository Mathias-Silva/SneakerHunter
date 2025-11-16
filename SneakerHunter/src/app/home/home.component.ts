import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SneakerService } from '../services/sneaker.service';
import { Sneaker } from '../models/sneaker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  sneakers: Sneaker[] = [];
  filteredSneakers: Sneaker[] = [];
  
  // Filtros
  searchTerm = '';
  selectedGender: 'todos' | 'masculino' | 'feminino' | 'unissex' = 'todos';
  selectedBrands: string[] = [];
  brands: string[] = [];
  
  loading = false;
  error = '';
  private sub?: Subscription;

  constructor(public sneakerService: SneakerService) {}

  ngOnInit(): void {
    this.loading = true;
    console.log('[HomeComponent] Iniciando...');
    
    // Assina o stream de produtos
    this.sub = this.sneakerService.sneakers$.subscribe({
      next: list => {
        console.log('[HomeComponent] Produtos atualizados:', list);
        this.sneakers = list;
        this.extractBrands();
        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        console.error('[HomeComponent] Erro ao carregar:', err);
        this.error = 'Erro ao carregar produtos';
        this.loading = false;
      }
    });

    this.sneakerService.loadAll();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Extrai marcas únicas dos produtos
  extractBrands(): void {
    const uniqueBrands = [...new Set(this.sneakers.map(s => s.brand))];
    this.brands = uniqueBrands.sort();
    console.log('[HomeComponent] Marcas disponíveis:', this.brands);
  }

  // Aplica todos os filtros
  applyFilters(): void {
    let filtered = [...this.sneakers];

    // Filtro de pesquisa
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.brand.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
      );
    }

    // Filtro de gênero
    if (this.selectedGender !== 'todos') {
      filtered = filtered.filter(s => s.gender === this.selectedGender || s.gender === 'unissex');
    }

    // Filtro de marca
    if (this.selectedBrands.length > 0) {
      filtered = filtered.filter(s => this.selectedBrands.includes(s.brand));
    }

    this.filteredSneakers = filtered;
    console.log('[HomeComponent] Produtos após filtro:', this.filteredSneakers.length);
  }

  // Métodos chamados pelos filtros
  onSearchChange(): void {
    this.applyFilters();
  }

  onGenderChange(gender: 'todos' | 'masculino' | 'feminino' | 'unissex'): void {
    this.selectedGender = gender;
    this.applyFilters();
  }

  toggleBrand(brand: string): void {
    const index = this.selectedBrands.indexOf(brand);
    if (index > -1) {
      this.selectedBrands.splice(index, 1);
    } else {
      this.selectedBrands.push(brand);
    }
    this.applyFilters();
  }

  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.includes(brand);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedGender = 'todos';
    this.selectedBrands = [];
    this.applyFilters();
  }

  addToCart(sneaker: Sneaker): void {
    console.log('[HomeComponent] Adicionar ao carrinho:', sneaker);
  }

  addToFavorites(sneaker: Sneaker): void {
    console.log('[HomeComponent] Adicionar aos favoritos:', sneaker);
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.sneakerService.loadAll();
  }
}

