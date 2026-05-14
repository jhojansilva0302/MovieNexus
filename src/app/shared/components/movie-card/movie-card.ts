import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Movie } from '../../../core/models/movie.model';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterModule, CommonModule, DecimalPipe],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css'
})
export class MovieCard {
  @Input({ required: true }) movie!: Movie;
  
  private favoritesService = inject(FavoritesService);

  get isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.movie.id);
  }

  toggleFavorite(event: Event) {
    event.preventDefault(); // Evita navegar al detalle al dar click al corazón
    event.stopPropagation();
    this.favoritesService.toggleFavorite(this.movie);
  }
}
