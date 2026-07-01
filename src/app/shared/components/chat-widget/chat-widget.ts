import { Component, inject, signal, effect, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy, SecurityContext, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GeminiService } from '../../../core/services/gemini.service';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWidget implements AfterViewChecked, OnDestroy {
  private geminiService = inject(GeminiService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // Signals mapeados desde el servicio
  readonly history = this.geminiService.history;
  readonly isLoading = this.geminiService.isLoading;
  readonly error = this.geminiService.error;

  // Estados locales para el comportamiento del widget
  readonly isOpen = signal<boolean>(false);
  readonly isMinimized = signal<boolean>(false);
  readonly isListening = signal<boolean>(false);

  messageText = '';
  private shouldScroll = false;

  // Web Speech API
  recognition: any;
  private speechTimeout: any;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor() {
    // Effect de Angular: Se activa automáticamente cada vez que el historial de chat cambia
    effect(() => {
      if (this.history().length > 0) {
        this.shouldScroll = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.isMinimized.set(false);
      this.shouldScroll = true;
    }
  }

  toggleMinimize(event: Event): void {
    event.stopPropagation(); // Evitar que cierre el chat si se pulsa la cabecera
    this.isMinimized.update(min => !min);
    if (!this.isMinimized()) {
      this.shouldScroll = true;
    }
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text) return;

    this.geminiService.sendMessage(text);
    this.messageText = '';
    this.shouldScroll = true;
  }

  clearChat(event: Event): void {
    event.stopPropagation();
    if (confirm('¿Seguro que deseas reiniciar tu conversación con Nexus AI?')) {
      this.geminiService.clearHistory();
    }
  }

  navigateToMovie(movieId: number): void {
    // Al hacer click en una película, navegamos a sus detalles
    this.router.navigate(['/movie', movieId]);
    // Opcionalmente podemos minimizar el chat para no tapar el contenido nuevo
    this.isMinimized.set(true);
  }

  /**
   * Helper para obtener la URL del póster de TMDB
   */
  getPosterUrl(path: string | null): string {
    if (!path) return 'assets/no-image.png';
    return `https://image.tmdb.org/t/p/w200${path}`;
  }

  /**
   * Genera el HTML seguro a partir de texto Markdown simple
   * Soporta negritas (**), listas (*), saltos de línea (\n) y enlaces ([text](url))
   */
  getSafeMarkdown(text: string): SafeHtml {
    if (!text) return '';

    // 1. Escapar HTML para evitar ataques XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="chat-link">$1</a>');

    // 4. Listas y saltos de línea ordenados
    const lines = escaped.split('\n');
    let inList = false;
    const parsedLines = lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemText = trimmed.substring(2);
        if (!inList) {
          inList = true;
          return `<ul class="chat-list"><li>${itemText}</li>`;
        }
        return `<li>${itemText}</li>`;
      } else {
        let result = '';
        if (inList) {
          inList = false;
          result = '</ul>';
        }
        // Solo agregar <br> al final de la línea si no es la última línea
        const isLast = idx === lines.length - 1;
        return result + line + (isLast ? '' : '<br>');
      }
    });

    if (inList) {
      parsedLines.push('</ul>');
    }
    
    let html = parsedLines.join('');
    
    // Evitar <br> superfluos al lado de etiquetas de lista
    html = html.replace(/<\/ul><br>/g, '</ul>');
    html = html.replace(/<br><ul/g, '<ul');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer && this.messageContainer.nativeElement) {
        const element = this.messageContainer.nativeElement;
        // Animamos o asignamos el scroll al fondo
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.warn('No se pudo realizar el scroll automático en el chat:', err);
    }
  }

  ngOnDestroy(): void {
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
    }
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Reconocimiento de voz no soportado en este navegador.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.zone.run(() => {
        this.isListening.set(true);
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isListening.set(false);
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Error de SpeechRecognition:', event.error);
      this.zone.run(() => {
        this.isListening.set(false);
      });
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        this.zone.run(() => {
          this.messageText = transcript;
          this.cdr.markForCheck();

          // Auto-envío inteligente tras 600ms
          if (this.speechTimeout) clearTimeout(this.speechTimeout);
          this.speechTimeout = setTimeout(() => {
            this.zone.run(() => {
              this.sendMessage();
              this.cdr.markForCheck();
            });
          }, 600);
        });
      }
    };
  }

  toggleListening(): void {
    if (typeof window === 'undefined') return;

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      alert('Tu navegador no soporta el reconocimiento de voz (SpeechRecognition). Pruebe con Google Chrome.');
      return;
    }

    if (this.isListening()) {
      this.recognition.stop();
    } else {
      if (this.speechTimeout) clearTimeout(this.speechTimeout);
      this.recognition.start();
    }
  }
}
