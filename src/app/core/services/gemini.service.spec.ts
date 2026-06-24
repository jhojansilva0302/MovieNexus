import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GeminiService } from './gemini.service';
import { MovieService } from './movie.service';
import { Movie } from '../models/movie.model';

describe('GeminiService', () => {
  let service: GeminiService;
  let httpMock: HttpTestingController;
  let movieServiceMock: any;

  const mockMovie: Movie = {
    id: 99,
    title: 'Interstellar',
    overview: 'Un grupo de exploradores viaja a través de un agujero de gusano.',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    vote_average: 8.6,
    release_date: '2014-11-07'
  };

  beforeEach(() => {
    movieServiceMock = {
      searchMovies: vi.fn().mockReturnValue(of({ results: [mockMovie] }))
    };

    TestBed.configureTestingModule({
      providers: [
        GeminiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MovieService, useValue: movieServiceMock }
      ]
    });

    service = TestBed.inject(GeminiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente e inicializar el mensaje de bienvenida', () => {
    expect(service).toBeTruthy();
    const history = service.history();
    expect(history.length).toBe(1);
    expect(history[0].role).toBe('model');
    expect(history[0].text).toContain('Nexus AI');
  });

  it('debe enviar un mensaje, actualizar el historial y realizar la consulta HTTP', () => {
    const userMsg = 'Hola Nexus, ¿qué me recomiendas?';
    
    service.sendMessage(userMsg);

    // El historial debe tener 2 elementos de forma inmediata (bienvenida + mensaje usuario)
    let history = service.history();
    expect(history.length).toBe(2);
    expect(history[1].role).toBe('user');
    expect(history[1].text).toBe(userMsg);
    expect(service.isLoading()).toBe(true);

    // Debe realizar la petición HTTP POST a /api/chat
    const req = httpMock.expectOne('/api/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.message).toBe(userMsg);
    
    // Responder con éxito
    req.flush({
      message: 'Te recomiendo ver Interstellar.',
      recommendations: [{ title: 'Interstellar' }]
    });

    // Se activará el mock de búsqueda de películas en TMDB
    expect(movieServiceMock.searchMovies).toHaveBeenCalledWith('Interstellar');

    // Tras la resolución, el historial tendrá 3 elementos (incluida la respuesta enriquecida de AI)
    history = service.history();
    expect(history.length).toBe(3);
    expect(history[2].role).toBe('model');
    expect(history[2].text).toBe('Te recomiendo ver Interstellar.');
    expect(history[2].recommendations?.length).toBe(1);
    expect(history[2].recommendations?.[0]).toEqual(mockMovie);
    expect(service.isLoading()).toBe(false);
  });

  it('debe manejar errores de red y de API de forma segura sin romper el historial', () => {
    service.sendMessage('Mensaje de prueba');

    const req = httpMock.expectOne('/api/chat');
    req.flush('Error de servidor', { status: 500, statusText: 'Internal Server Error' });

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toContain('Error al conectar con Nexus AI');

    const history = service.history();
    // Debe haber añadido una burbuja de error amigable en el chat
    expect(history.length).toBe(3); // bienvenida + usuario + error model
    expect(history[2].role).toBe('model');
    expect(history[2].text).toContain('no puedo conectar con el servidor');
  });

  it('debe limpiar el historial conversacional al llamar a clearHistory', () => {
    service.sendMessage('Mensaje 1');
    const req = httpMock.expectOne('/api/chat');
    req.flush({ message: 'Respuesta 1', recommendations: [] });

    expect(service.history().length).toBe(3);

    service.clearHistory();

    // Debe volver a tener únicamente el mensaje de bienvenida
    expect(service.history().length).toBe(1);
    expect(service.error()).toBeNull();
  });
});
