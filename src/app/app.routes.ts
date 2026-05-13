import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'peliculas', component: Home }, // Placeholder
    { path: 'buscar', component: Home },    // Placeholder
    { path: '**', redirectTo: '' }          // Wildcard
];