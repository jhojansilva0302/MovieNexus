import { Component, OnInit, OnChanges, SimpleChanges, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentService } from '../../../../core/services/comment.service';
import { Comment } from '../../../../core/models/comment.model';

@Component({
  selector: 'app-movie-comments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movie-comments.html',
  styleUrl: './movie-comments.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieComments implements OnInit, OnChanges {
  private commentService = inject(CommentService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @Input() movieId!: string | number;

  comments: Comment[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  submitError: string | null = null;
  submitSuccess = false;

  // Estado del hover de estrellas para calificación interactiva
  hoveredRating = 0;

  // Formulario reactivo
  commentForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadComments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['movieId'] && !changes['movieId'].firstChange) {
      this.loadComments();
      this.resetFormState();
    }
  }

  private initForm(): void {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.maxLength(50)]],
      text: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  loadComments(): void {
    if (!this.movieId) return;

    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.commentService.getCommentsByMovie(this.movieId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.comments = data.sort((a, b) => {
            // Ordenar los comentarios por fecha más reciente
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.message || 'Error al cargar los comentarios.';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onSubmit(): void {
    if (this.commentForm.invalid || this.isSubmitting) {
      this.commentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;
    this.submitSuccess = false;
    this.cdr.markForCheck();

    const { author, text, rating } = this.commentForm.value;

    this.commentService.addComment(author, text, rating, this.movieId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitSuccess = true;
          this.isSubmitting = false;
          this.resetFormState();
          this.loadComments(); // Recarga la lista de comentarios
          this.cdr.markForCheck();

          // Ocultar mensaje de éxito después de 4 segundos
          setTimeout(() => {
            this.submitSuccess = false;
            this.cdr.markForCheck();
          }, 4000);
        },
        error: (err) => {
          this.submitError = err.message || 'Error al enviar el comentario.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Métodos para interactuar con la calificación de estrellas
  setHoveredRating(rating: number): void {
    this.hoveredRating = rating;
  }

  clearHoveredRating(): void {
    this.hoveredRating = 0;
  }

  selectRating(rating: number): void {
    this.commentForm.patchValue({ rating });
    this.commentForm.get('rating')?.markAsDirty();
    this.commentForm.get('rating')?.markAsTouched();
  }

  get currentRating(): number {
    return this.commentForm?.get('rating')?.value || 0;
  }

  private resetFormState(): void {
    if (this.commentForm) {
      this.commentForm.reset({
        author: '',
        text: '',
        rating: 0
      });
    }
    this.hoveredRating = 0;
    this.submitError = null;
  }

  // Helper para verificar errores de validación en la plantilla
  hasError(controlName: string, errorName: string): boolean {
    const control = this.commentForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.touched || control.dirty));
  }
}
