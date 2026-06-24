import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MovieService } from './movie.service';
import { Movie } from '../models/movie.model';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  recommendations?: Movie[]; // Películas enriquecidas desde TMDB
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private http = inject(HttpClient);
  private movieService = inject(MovieService);

  // Signals para gestionar el estado de la IA de forma reactiva y limpia
  readonly history = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.initWelcomeMessage();
  }

  /**
   * Inicializa el chat con un mensaje de bienvenida de Nexus AI.
   */
  private initWelcomeMessage(): void {
    this.history.set([
      {
        role: 'model',
        text: '¡Hola! Soy **Nexus AI**, tu consejero cinéfilo inteligente. 🎬\n\n¿No sabes qué ver hoy? Pregúntame por tus géneros favoritos, directores, actores, o simplemente dime cómo te sientes y te recomendaré excelentes películas en tiempo real.'
      }
    ]);
  }

  /**
   * Envía un mensaje a Nexus AI a través de la función serverless /api/chat
   * e integra los resultados con la API de TMDB para enriquecer las recomendaciones.
   * @param messageText Texto del mensaje del usuario
   */
  sendMessage(messageText: string): void {
    const text = messageText.trim();
    if (!text || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    // Obtener el historial conversacional previo antes de añadir el nuevo mensaje del usuario
    const previousHistory = this.history();

    // Añadir de inmediato el mensaje del usuario al historial para feedback instantáneo
    this.history.update(h => [...h, { role: 'user', text: text }]);

    // Enviar petición al backend serverless
    this.http.post<{ message: string; recommendations: { title: string }[] }>('/api/chat', {
      message: text,
      history: previousHistory
    }).subscribe({
      next: (res) => {
        // Si el backend devolvió recomendaciones de películas, las buscamos en TMDB
        if (res.recommendations && res.recommendations.length > 0) {
          const searchObservables = res.recommendations.map(rec =>
            this.movieService.searchMovies(rec.title).pipe(
              map(searchRes => {
                if (searchRes && searchRes.results && searchRes.results.length > 0) {
                  // Retorna la primera coincidencia que tiene póster e información básica
                  return searchRes.results[0];
                }
                return null;
              }),
              catchError(() => of(null)) // Ignorar errores individuales para que una falla de búsqueda no rompa todo
            )
          );

          forkJoin(searchObservables).subscribe({
            next: (movies) => {
              // Filtrar resultados nulos
              const enrichedMovies = movies.filter((m): m is Movie => m !== null);

              // Registrar respuesta del modelo en el historial con el carrusel de películas enriquecidas
              this.history.update(h => [...h, {
                role: 'model',
                text: res.message,
                recommendations: enrichedMovies
              }]);
              this.isLoading.set(false);
            },
            error: () => {
              // En caso de que falle la comunicación con TMDB, aun así mostramos la respuesta de texto de Gemini
              this.history.update(h => [...h, {
                role: 'model',
                text: res.message,
                recommendations: []
              }]);
              this.isLoading.set(false);
            }
          });
        } else {
          // Si no hay películas sugeridas, simplemente añadimos el mensaje de texto al historial
          this.history.update(h => [...h, {
            role: 'model',
            text: res.message,
            recommendations: []
          }]);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        const errMsg = err.error?.message || 'Error al conectar con Nexus AI. Por favor, inténtalo de nuevo.';
        this.error.set(errMsg);
        
        // Registrar respuesta de error amistosa en el chat para no romper la experiencia
        this.history.update(h => [...h, {
          role: 'model',
          text: 'Lo siento, en este momento no puedo conectar con el servidor de inteligencia artificial. Por favor, verifica tu conexión a internet o intenta más tarde.'
        }]);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Limpia el historial conversacional y restablece el mensaje de bienvenida.
   */
  clearHistory(): void {
    this.error.set(null);
    this.initWelcomeMessage();
  }
}
