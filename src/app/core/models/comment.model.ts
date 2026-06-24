/**
 * Modelo que representa un comentario de la API de comentarios.
 * Los nombres de las propiedades se ajustan exactamente a las respuestas reales de la API.
 */
export interface Comment {
  id: number;
  appId: string;     // Corresponde a applicationId ("MovieNexus")
  itemId: string;    // Corresponde a movieId (ej: "movie-299536")
  author: string;
  text: string;      // Corresponde a comment
  rating: number;
  createdAt: string;
}

/**
 * DTO para la creación de un nuevo comentario.
 */
export interface CreateCommentDto {
  appId: string;
  itemId: string;
  author: string;
  text: string;
  rating: number;
}
