import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Movie, MovieDetail, MovieResponse } from '../models/movie.model';

/**
 * Servicio Especializado - Mensajero de Películas (Guía Día 2 - Paso 4)
 *
 * Principio Single Responsibility: Este servicio se encarga ÚNICAMENTE
 * de comunicarse con la API de TMDB. Los componentes (Home, Peliculas, etc.)
 * solo se preocupan de MOSTRAR datos, no de dónde vienen.
 */
@Injectable({ providedIn: 'root' }) // Disponible en toda la app
export class MovieService {
  private http = inject(HttpClient); // Inyectamos el motor HTTP
  private apiUrl = environment.baseUrl;

  getTrendingMovies() {
    // Retornamos un Observable (una promesa de que llegarán datos)
    return this.http.get<MovieResponse>(`${this.apiUrl}/trending/movie/day`);
  }

  /**
   * Obtiene las películas más populares
   */
  getPopularMovies(page: number = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(`${this.apiUrl}/movie/popular`, {
      params: { page: page.toString() }
    });
  }

  /**
   * Obtiene las películas mejor valoradas
   */
  getTopRatedMovies(page: number = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(`${this.apiUrl}/movie/top_rated`, {
      params: { page: page.toString() }
    });
  }

  /**
   * Obtiene los próximos estrenos
   */
  getUpcomingMovies(page: number = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(`${this.apiUrl}/movie/upcoming`, {
      params: { page: page.toString() }
    });
  }

  /**
   * Busca películas por texto
   */
  searchMovies(query: string, page: number = 1): Observable<MovieResponse> {
    return this.http.get<MovieResponse>(`${this.apiUrl}/search/movie`, {
      params: { query, page: page.toString() }
    });
  }

  /**
   * Obtiene el detalle completo de una película por su ID
   */
  getMovieById(id: number): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`${this.apiUrl}/movie/${id}`);
  }

  /**
   * Construye la URL completa de una imagen de TMDB
   * @param path - El path que devuelve la API (ej: /abc123.jpg)
   * @param size - El tamaño deseado (w200, w500, w780, original)
   */
  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return 'assets/no-image.png';
    return `${this.imageUrl}/${size}${path}`;
  }
}
