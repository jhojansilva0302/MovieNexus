import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Comment, CreateCommentDto } from '../models/comment.model';

/**
 * Servicio encargado de la comunicación con la API de comentarios y calificaciones.
 * Principio Single Responsibility: Maneja peticiones HTTP y procesamiento/filtrado de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = environment.commentsApiUrl;
  private appId = 'MovieNexus';

  /**
   * Obtiene y filtra los comentarios correspondientes a una película.
   * Debido a que la API retorna la lista completa, el filtrado se realiza client-side.
   * @param movieId ID de la película (número o string)
   */
  getCommentsByMovie(movieId: string | number): Observable<Comment[]> {
    const expectedItemId = typeof movieId === 'string' && movieId.startsWith('movie-')
      ? movieId
      : `movie-${movieId}`;

    return this.http.get<Comment[]>(this.apiUrl).pipe(
      map((comments: Comment[]) => {
        // Asegura que los comentarios correspondan a la aplicación actual y al ID de película esperado
        return (comments || []).filter(
          (c) => c.appId === this.appId && c.itemId === expectedItemId
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Publica un nuevo comentario en la API.
   * @param author Nombre del autor del comentario
   * @param commentText Texto del comentario
   * @param rating Calificación (1 a 5)
   * @param movieId ID de la película
   */
  addComment(
    author: string,
    commentText: string,
    rating: number,
    movieId: string | number
  ): Observable<Comment> {
    const itemId = typeof movieId === 'string' && movieId.startsWith('movie-')
      ? movieId
      : `movie-${movieId}`;

    const newComment: CreateCommentDto = {
      appId: this.appId,
      itemId: itemId,
      author: author,
      text: commentText,
      rating: rating
    };

    return this.http.post<Comment>(this.apiUrl, newComment).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado al conectar con la API.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o red
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error retornado por el servidor
      errorMessage = `Error del servidor (Código ${error.status}): ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
