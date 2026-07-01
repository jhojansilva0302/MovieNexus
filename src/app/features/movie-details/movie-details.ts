import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../core/services/movie.service';
import { MovieDetail, CountryProviders } from '../../core/models/movie.model';
import { CastCard } from '../../shared/components/cast-card/cast-card';
import { Observable, forkJoin, map } from 'rxjs';
import { CreditsResponse } from '../../core/models/cast.model';
import { MovieTrailer } from './components/movie-trailer/movie-trailer';
import { MovieComments } from './components/movie-comments/movie-comments';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, CastCard, MovieTrailer, MovieComments],
  templateUrl: './movie-details.html',
  styleUrl: './movie-details.css'
})
export class MovieDetails implements OnInit, OnChanges {
  public movieService = inject(MovieService);

  @Input() id!: string;

  // Declaramos un Observable que contendrá TODOS los datos que necesitamos
  movieData$!: Observable<{
    details: MovieDetail;
    credits: CreditsResponse;
    providers: CountryProviders | null;
  }>;

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
      // forkJoin dispara todas las peticiones al mismo tiempo y crea un objeto con los resultados
      this.movieData$ = forkJoin({
        details: this.movieService.getMovieById(this.id),
        credits: this.movieService.getMovieCredits(this.id),
        providersResponse: this.movieService.getWatchProviders(this.id)
      }).pipe(
        map(({ details, credits, providersResponse }) => {
          // Detectar de manera dinámica la región del usuario (navigator.language)
          const userLanguage = typeof navigator !== 'undefined' ? navigator.language : 'es-ES';
          let countryCode = 'ES'; // Default fallback
          if (userLanguage.includes('-')) {
            const part = userLanguage.split('-')[1].toUpperCase();
            if (part.length === 2) {
              countryCode = part;
            }
          } else {
            const lang = userLanguage.toLowerCase();
            if (lang === 'es') countryCode = 'ES';
            else if (lang === 'en') countryCode = 'US';
          }

          const providers = providersResponse.results[countryCode] || providersResponse.results['US'] || null;

          return { details, credits, providers };
        })
      );
    }
  }

  getBackdropUrl(path: string | null | undefined): string {
    return path ? `https://image.tmdb.org/t/p/original${path}` : '';
  }

  getProviderLogoUrl(path: string | null): string {
    return this.movieService.getImageUrl(path, 'w92');
  }
}
