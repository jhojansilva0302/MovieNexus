import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MovieComments } from './movie-comments';
import { CommentService } from '../../../../core/services/comment.service';
import { Comment } from '../../../../core/models/comment.model';

describe('MovieComments Component', () => {
  let component: MovieComments;
  let fixture: ComponentFixture<MovieComments>;
  let commentServiceMock: any;

  const mockComments: Comment[] = [
    {
      id: 1,
      appId: 'MovieNexus',
      itemId: 'movie-100',
      author: 'Carlos Gomez',
      text: 'Excelente película, muy recomendada.',
      rating: 5,
      createdAt: '2026-06-24T12:00:00.000Z'
    },
    {
      id: 2,
      appId: 'MovieNexus',
      itemId: 'movie-100',
      author: 'Ana Ruiz',
      text: 'Entretenida pero predecible.',
      rating: 3,
      createdAt: '2026-06-24T13:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    commentServiceMock = {
      getCommentsByMovie: vi.fn().mockReturnValue(of(mockComments)),
      addComment: vi.fn().mockReturnValue(of({
        id: 3,
        appId: 'MovieNexus',
        itemId: 'movie-100',
        author: 'Luis Perez',
        text: 'Nueva reseña de prueba.',
        rating: 4,
        createdAt: new Date().toISOString()
      }))
    };

    await TestBed.configureTestingModule({
      imports: [MovieComments, ReactiveFormsModule],
      providers: [
        { provide: CommentService, useValue: commentServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovieComments);
    component = fixture.componentInstance;
    component.movieId = 100;
  });

  it('debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe cargar y renderizar comentarios al inicializarse', () => {
    fixture.detectChanges(); // Ejecuta ngOnInit y carga comentarios
    
    expect(commentServiceMock.getCommentsByMovie).toHaveBeenCalledWith(100);
    expect(component.comments.length).toBe(2);
    expect(component.isLoading).toBe(false);

    // Verificar renderizado en el DOM
    const compiled = fixture.nativeElement as HTMLElement;
    const commentCards = compiled.querySelectorAll('.comment-item-card');
    expect(commentCards.length).toBe(2);
    expect(commentCards[0].querySelector('.author-name')?.textContent).toContain('Ana Ruiz'); // Ana Ruiz tiene fecha más reciente (13:00:00 vs 12:00:00)
  });

  it('debe mostrar estado vacío cuando no hay comentarios', () => {
    commentServiceMock.getCommentsByMovie.mockReturnValue(of([]));
    fixture.detectChanges();

    expect(component.comments.length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state-card')).toBeTruthy();
  });

  it('debe mostrar estado de error cuando la API falla', () => {
    commentServiceMock.getCommentsByMovie.mockReturnValue(throwError(() => new Error('Error de conexión')));
    fixture.detectChanges();

    expect(component.error).toBe('Error de conexión');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-state-card')).toBeTruthy();
    expect(compiled.querySelector('.error-state-card p')?.textContent).toContain('Error de conexión');
  });

  describe('Validaciones del Formulario', () => {
    beforeEach(() => {
      fixture.detectChanges(); // Inicializar formulario
    });

    it('el formulario debe ser inválido al inicio', () => {
      expect(component.commentForm.invalid).toBe(true);
    });

    it('debe validar que el campo author sea obligatorio', () => {
      const authorControl = component.commentForm.get('author');
      authorControl?.setValue('');
      expect(authorControl?.valid).toBe(false);
      expect(authorControl?.errors?.['required']).toBeTruthy();
    });

    it('debe validar que el comentario tenga al menos 5 caracteres', () => {
      const textControl = component.commentForm.get('text');
      
      textControl?.setValue('Hola');
      expect(textControl?.valid).toBe(false);
      expect(textControl?.errors?.['minlength']).toBeTruthy();

      textControl?.setValue('Hola mundo');
      expect(textControl?.valid).toBe(true);
    });

    it('debe validar que la calificación sea obligatoria y mayor a 0', () => {
      const ratingControl = component.commentForm.get('rating');
      ratingControl?.setValue(0);
      expect(ratingControl?.valid).toBe(false);
      expect(ratingControl?.errors?.['min']).toBeTruthy();

      ratingControl?.setValue(4);
      expect(ratingControl?.valid).toBe(true);
    });
  });

  describe('Envío del Formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('no debe enviar si el formulario es inválido', () => {
      component.onSubmit();
      expect(commentServiceMock.addComment).not.toHaveBeenCalled();
    });

    it('debe enviar el comentario, mostrar mensaje de éxito y recargar lista al ser válido', () => {
      // Completar formulario válido
      component.commentForm.get('author')?.setValue('Luis Perez');
      component.commentForm.get('text')?.setValue('Nueva reseña de prueba.');
      component.commentForm.get('rating')?.setValue(4);
      
      // Enviar
      component.onSubmit();
      
      expect(commentServiceMock.addComment).toHaveBeenCalledWith(
        'Luis Perez',
        'Nueva reseña de prueba.',
        4,
        100
      );
      
      fixture.detectChanges();

      expect(component.submitSuccess).toBe(true);
      expect(component.commentForm.get('author')?.value).toBe(''); // Reseteado
      expect(component.commentForm.get('text')?.value).toBe('');   // Reseteado
      expect(component.commentForm.get('rating')?.value).toBe(0);   // Reseteado

      // Debe haber llamado a getCommentsByMovie una segunda vez para recargar
      expect(commentServiceMock.getCommentsByMovie).toHaveBeenCalledTimes(2);
    });
  });
});
