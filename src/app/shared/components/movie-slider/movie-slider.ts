import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie } from '../../../core/models/movie.model';
import { MovieCard } from '../movie-card/movie-card';
import { SkeletonCard } from '../skeleton-card/skeleton-card';

@Component({
  selector: 'app-movie-slider',
  standalone: true,
  imports: [CommonModule, MovieCard, SkeletonCard],
  templateUrl: './movie-slider.html',
  styleUrl: './movie-slider.css',
})
export class MovieSlider {
  @Input() movies: Movie[] = [];
}
