import { Component, inject, OnInit, signal, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { MovieService } from '../../core/services/movie.service';
import { HeroComponent } from './components/hero/hero';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { Movie } from '../../core/models/movie.model';
import { SkeletonHero } from '../../shared/components/skeleton-hero/skeleton-hero';
import { SkeletonCard } from '../../shared/components/skeleton-card/skeleton-card';
import { MovieSlider } from '../../shared/components/movie-slider/movie-slider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, MovieCard, SkeletonHero, SkeletonCard, MovieSlider],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit {
  private movieService = inject(MovieService);
  private platformId = inject(PLATFORM_ID);

  // Marcamos un elemento del HTML para observarlo
  @ViewChild('infiniteAnchor') infiniteAnchor!: ElementRef;

  // Signals para las categorías de películas y el Infinite Scroll
  featuredMovie = signal<Movie | null>(null);
  popularMovies = signal<Movie[]>([]);
  topRatedMovies = signal<Movie[]>([]);
  
  catalogMovies = signal<Movie[]>([]);
  currentPage = signal(1);
  isFetchingNextPage = signal(false);

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

  ngAfterViewInit(): void {
    // 3. Solo configuramos el observador en el navegador (SSR Safety)
    if (isPlatformBrowser(this.platformId)) {
      this.initInfiniteScroll();
    }
  }

  private initInfiniteScroll(): void {
    const observer = new IntersectionObserver((entries) => {
      // 4. Si el ancla entra en el campo de visión y no estamos cargando...
      if (entries[0].isIntersecting && !this.isFetchingNextPage()) {
        this.loadMoreMovies();
      }
    }, { rootMargin: '200px' }); // 'rootMargin' permite cargar 200px antes de llegar al final

    observer.observe(this.infiniteAnchor.nativeElement);
  }

  loadMoreMovies(): void {
    this.isFetchingNextPage.set(true);
    this.movieService.getPopularMovies(this.currentPage()).subscribe({
      next: (data) => {
        // 5. Inmutabilidad: Concatenamos los resultados usando el operador spread [...]
        this.catalogMovies.set([...this.catalogMovies(), ...data.results]);
        this.currentPage.update(p => p + 1);
        this.isFetchingNextPage.set(false);
      },
      error: () => {
        this.isFetchingNextPage.set(false);
      }
    });
  }
}

