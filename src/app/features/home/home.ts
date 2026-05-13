import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MovieService } from '../../core/services/movie.service';
import { HeroComponent } from './components/hero/hero';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DecimalPipe, HeroComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private movieService = inject(MovieService);

  // Usamos una Signal para guardar la película destacada
  featuredMovie = signal<Movie | null>(null);
  trendingMovies: Movie[] = [];

  ngOnInit(): void {
    this.movieService.getTrendingMovies().subscribe({
      next: (data) => {
        this.trendingMovies = data.results;
        if (data.results.length > 0) {
          // Tomamos la posición [0] del array para ser el Hero
          this.featuredMovie.set(data.results[0]);
        }
      }
    });
  }
}
