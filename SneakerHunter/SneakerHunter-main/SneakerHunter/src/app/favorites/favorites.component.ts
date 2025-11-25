import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { FavoritesService } from '../services/favorite.service';
import { SneakerService } from '../services/sneaker.service';
import { CartService } from '../services/cart.service';
import { Sneaker } from '../models/sneaker';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favItems$!: Observable<Sneaker[]>;
  // map sneaker id -> selected size (public para usar no template)
  selectedSizes: { [id: string]: number | null } = {};

  constructor(
    public fav: FavoritesService,
    private sneakerService: SneakerService,
    private cart: CartService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.fav.loadForUser().subscribe();

    const allSneakers$ = this.sneakerService.getAll();

    this.favItems$ = combineLatest([this.fav.items$, allSneakers$]).pipe(
      map(([ids, allSneakers]: [(string | number)[], Sneaker[]]) => {
        const result = ids
          .map(id => allSneakers.find(s => String(s.id) === String(id)))
          .filter(Boolean) as Sneaker[];
        
        // initialize selectedSizes for each favorite (first size ou null)
        for (const s of result) {
          const sid = String(s.id ?? '');
          if (!(sid in this.selectedSizes)) {
            this.selectedSizes[sid] = (s.sizes && s.sizes.length) ? s.sizes[0] : null;
          }
        }
        return result;
      })
    );
  }

  selectSize(s: Sneaker, size: number) {
    if (!s?.id) return;
    this.selectedSizes[String(s.id)] = size;
  }

  isSelectedSize(s: Sneaker, size: number): boolean {
    return String(this.selectedSizes[String(s.id)]) === String(size);
  }

  addToCart(s: Sneaker) {
    if (!s?.id) return;
    const id = String(s.id ?? '');
    const available = s.sizes && s.sizes.length;
    const selected = this.selectedSizes[id];

    if (available && (selected == null || selected === undefined)) {
      const list = s.sizes!.join(', ');
      const input = window.prompt(`Selecione o tamanho para "${s.name}"\nOpções: ${list}`, '');
      if (!input) {
        alert('Operação cancelada. Selecione um tamanho.');
        return;
      }
      const chosen = Number(input);
      if (!s.sizes!.includes(chosen)) {
        alert('Tamanho inválido. Operação cancelada.');
        return;
      }
      this.selectedSizes[id] = chosen;
      this.cart.addToCart(s, 1, chosen);
      return;
    }

    const size = selected ?? undefined;
    this.cart.addToCart(s, 1, size);
  }

  toggleFavorite(id: any) { 
    this.fav.toggle(id); 
  }
}
