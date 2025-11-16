import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../services/favorite.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent {
  favIds$;

  constructor(private fav: FavoritesService) {
    this.favIds$ = this.fav.favs$;
  }

  remove(id: number) {
    this.fav.toggleFavorite({ id } as any);
  }
}
