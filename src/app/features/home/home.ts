import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MovieService } from '../../core/services/movie.service';
import { HeroComponent } from './components/hero/hero';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, MovieCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private movieService = inject(MovieService);

  // Signals para las categorías de películas
  featuredMovie = signal<Movie | null>(null);
  popularMovies = signal<Movie[]>([]);
  topRatedMovies = signal<Movie[]>([]);

  ngOnInit(): void {
    // 1. Películas en Tendencia (para el Hero y opcionalmente una lista)
    this.movieService.getTrendingMovies().subscribe({
      next: (data) => {
        if (data.results.length > 0) {
          this.featuredMovie.set(data.results[0]);
        }
      }
    });

    // 2. Películas Populares
    this.movieService.getPopularMovies().subscribe({
      next: (data) => {
        this.popularMovies.set(data.results);
      }
    });

    // 3. Películas Mejor Valoradas
    this.movieService.getTopRatedMovies().subscribe({
      next: (data) => {
        this.topRatedMovies.set(data.results);
      }
    });
  }
}
