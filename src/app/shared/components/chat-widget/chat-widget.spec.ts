import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ChatWidget } from './chat-widget';
import { GeminiService, ChatMessage } from '../../../core/services/gemini.service';

describe('ChatWidget Component', () => {
  let component: ChatWidget;
  let fixture: ComponentFixture<ChatWidget>;
  let geminiServiceMock: any;
  let routerMock: any;

  const mockHistory: ChatMessage[] = [
    {
      role: 'model',
      text: 'Bienvenido. Soy **Nexus AI**.'
    },
    {
      role: 'user',
      text: 'Recomiéndame algo.'
    }
  ];

  beforeEach(async () => {
    geminiServiceMock = {
      history: signalSpy(mockHistory),
      isLoading: signalSpy(false),
      error: signalSpy(null),
      sendMessage: vi.fn(),
      clearHistory: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatWidget, FormsModule],
      providers: [
        { provide: GeminiService, useValue: geminiServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatWidget);
    component = fixture.componentInstance;
  });

  // Auxiliar para mockear Angular Signals de lectura
  function signalSpy<T>(initialValue: T) {
    const sig = vi.fn().mockReturnValue(initialValue);
    return sig;
  }

  it('debe crearse correctamente y estar cerrado al inicio', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('debe abrir y cerrar el chat al llamar a toggleChat', () => {
    fixture.detectChanges();
    component.toggleChat();
    expect(component.isOpen()).toBe(true);
    expect(component.isMinimized()).toBe(false);

    component.toggleChat();
    expect(component.isOpen()).toBe(false);
  });

  it('debe minimizar y expandir el chat al llamar a toggleMinimize', () => {
    fixture.detectChanges();
    component.toggleChat(); // abrir primero
    expect(component.isMinimized()).toBe(false);

    const event = new MouseEvent('click');
    component.toggleMinimize(event);
    expect(component.isMinimized()).toBe(true);

    component.toggleMinimize(event);
    expect(component.isMinimized()).toBe(false);
  });

  it('debe enviar un mensaje al llamar a sendMessage y limpiar el input', () => {
    fixture.detectChanges();
    component.messageText = '  Recomendación de Nolan  ';
    
    component.sendMessage();

    expect(geminiServiceMock.sendMessage).toHaveBeenCalledWith('Recomendación de Nolan');
    expect(component.messageText).toBe('');
  });

  it('debe navegar a la película y minimizar el chat al llamar a navigateToMovie', () => {
    fixture.detectChanges();
    component.toggleChat();
    component.navigateToMovie(123);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/movie', 123]);
    expect(component.isMinimized()).toBe(true);
  });

  it('debe formatear markdown de manera segura a etiquetas HTML', () => {
    fixture.detectChanges();
    
    // Probar negritas
    let safeHtml = component.getSafeMarkdown('Hola **Mundo**');
    let htmlString = (safeHtml as any).changingThisBreaksApplicationSecurity;
    expect(htmlString).toContain('<strong>Mundo</strong>');

    // Probar enlaces
    safeHtml = component.getSafeMarkdown('Mira [Google](https://google.com)');
    htmlString = (safeHtml as any).changingThisBreaksApplicationSecurity;
    expect(htmlString).toContain('<a href="https://google.com"');
    expect(htmlString).toContain('class="chat-link"');

    // Probar listas
    safeHtml = component.getSafeMarkdown('Lista:\n* Item 1\n* Item 2');
    htmlString = (safeHtml as any).changingThisBreaksApplicationSecurity;
    expect(htmlString).toContain('<ul class="chat-list"><li>Item 1</li><li>Item 2</li></ul>');
  });
});
