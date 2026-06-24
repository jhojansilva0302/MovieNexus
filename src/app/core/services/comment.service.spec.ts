import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { CommentService } from './comment.service';
import { Comment } from '../models/comment.model';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;

  const mockComments: Comment[] = [
    {
      id: 1,
      appId: 'MovieNexus',
      itemId: 'movie-100',
      author: 'Juan Perez',
      text: 'Excelente película, muy recomendada.',
      rating: 5,
      createdAt: '2026-06-24T12:00:00.000Z'
    },
    {
      id: 2,
      appId: 'MovieNexus',
      itemId: 'movie-200',
      author: 'Maria Lopez',
      text: 'No me gustó mucho el final.',
      rating: 3,
      createdAt: '2026-06-24T13:00:00.000Z'
    },
    {
      id: 3,
      appId: 'OtroApp',
      itemId: 'movie-100',
      author: 'Pedro Gomez',
      text: 'Comentario de otra aplicación.',
      rating: 4,
      createdAt: '2026-06-24T14:00:00.000Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Asegura que no haya peticiones pendientes
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getCommentsByMovie', () => {
    it('debe retornar comentarios filtrados por appId e itemId', async () => {
      const promise = firstValueFrom(service.getCommentsByMovie(100));

      const req = httpMock.expectOne('https://api-comentarios-gm6f.onrender.com/api/comments');
      expect(req.request.method).toBe('GET');
      req.flush(mockComments);

      const comments = await promise;
      expect(comments.length).toBe(1);
      expect(comments[0].author).toBe('Juan Perez');
      expect(comments[0].itemId).toBe('movie-100');
      expect(comments[0].appId).toBe('MovieNexus');
    });

    it('debe retornar lista vacía si ningún comentario coincide', async () => {
      const promise = firstValueFrom(service.getCommentsByMovie(999));

      const req = httpMock.expectOne('https://api-comentarios-gm6f.onrender.com/api/comments');
      req.flush(mockComments);

      const comments = await promise;
      expect(comments.length).toBe(0);
    });

    it('debe manejar errores HTTP correctamente', async () => {
      const promise = firstValueFrom(service.getCommentsByMovie(100));

      const req = httpMock.expectOne('https://api-comentarios-gm6f.onrender.com/api/comments');
      req.flush('Error de red', { status: 500, statusText: 'Internal Server Error' });

      try {
        await promise;
        throw new Error('Debería haber fallado');
      } catch (error: any) {
        expect(error.message).toContain('Error del servidor');
      }
    });
  });

  describe('addComment', () => {
    it('debe enviar una petición POST con los datos correctos y retornar el nuevo comentario', async () => {
      const newCommentResponse: Comment = {
        id: 4,
        appId: 'MovieNexus',
        itemId: 'movie-100',
        author: 'Sofia Medina',
        text: 'Increíbles efectos especiales.',
        rating: 5,
        createdAt: '2026-06-24T15:00:00.000Z'
      };

      const promise = firstValueFrom(service.addComment('Sofia Medina', 'Increíbles efectos especiales.', 5, 100));

      const req = httpMock.expectOne('https://api-comentarios-gm6f.onrender.com/api/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        appId: 'MovieNexus',
        itemId: 'movie-100',
        author: 'Sofia Medina',
        text: 'Increíbles efectos especiales.',
        rating: 5
      });

      req.flush(newCommentResponse);

      const comment = await promise;
      expect(comment).toEqual(newCommentResponse);
    });

    it('debe propagar el error si falla el envío', async () => {
      const promise = firstValueFrom(service.addComment('Sofia Medina', 'Increíbles efectos especiales.', 5, 100));

      const req = httpMock.expectOne('https://api-comentarios-gm6f.onrender.com/api/comments');
      req.flush('Error', { status: 400, statusText: 'Bad Request' });

      try {
        await promise;
        throw new Error('Debería haber fallado');
      } catch (error: any) {
        expect(error.message).toContain('Error del servidor');
      }
    });
  });
});
