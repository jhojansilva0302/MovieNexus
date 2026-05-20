import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../core/services/movie.service';
import { MovieDetail } from '../../core/models/movie.model';
import { CastCard } from '../../shared/components/cast-card/cast-card';
import { Observable, forkJoin } from 'rxjs';
import { CreditsResponse } from '../../core/models/cast.model';
import { MovieTrailer } from './components/movie-trailer/movie-trailer';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, CastCard, MovieTrailer],
  templateUrl: './movie-details.html',
  styleUrl: './movie-details.css'
})
export class MovieDetails implements OnInit, OnChanges {
  private movieService = inject(MovieService);

  @Input() id!: string;

  // Declaramos un Observable que contendrá TODOS los datos que necesitamos
  movieData$!: Observable<{ details: MovieDetail; credits: CreditsResponse }>;

  ngOnInit(): void {
    this.loadMovieData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si el ID cambia, volvemos a cargar los datos
    if (changes['id'] && !changes['id'].firstChange) {
      this.loadMovieData();
    }
  }

  private loadMovieData(): void {
    if (this.id) {
      // forkJoin dispara ambas peticiones al mismo tiempo y crea un objeto con los dos resultados
      this.movieData$ = forkJoin({
        details: this.movieService.getMovieById(this.id),
        credits: this.movieService.getMovieCredits(this.id),
      });
    }
  }

  getBackdropUrl(path: string | null | undefined): string {
    return path ? `https://image.tmdb.org/t/p/original${path}` : '';
  }
}
