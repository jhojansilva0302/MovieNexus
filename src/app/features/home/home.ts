import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // Guía Día 2 - Reto Final: Inyección del servicio
  private movieService = inject(MovieService);

  trendingMovies: Movie[] = [];

  ngOnInit(): void {
    console.log('🎬 Home Inicializado. Cargando películas...');
    // Guía Día 2 - Reto Final: Llamar getTrendingMovies y console.log
    this.movieService.getTrendingMovies().subscribe({
      next: (response) => {
        this.trendingMovies = response.results;
        console.log('✅ ¡Éxito! Datos recibidos de TMDB:', this.trendingMovies);
      },
      error: (err) => console.error('❌ Error al cargar trending:', err)
    });
  }
}
