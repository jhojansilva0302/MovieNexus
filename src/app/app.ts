import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/layout/header/header';
import { Footer } from './shared/components/layout/footer/footer';
import { ChatWidget } from './shared/components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('MovieNexus');
}
