import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Interceptor Funcional - Escudo Inteligente (Guía Día 2 - Paso 3)
 *
 * Principio DRY: En lugar de agregar la api_key manualmente en cada
 * petición, este interceptor la agrega automáticamente a TODAS las
 * peticiones que salen de la aplicación hacia la API de TMDB.
 *
 * Usamos req.clone() porque las peticiones HTTP en Angular son
 * INMUTABLES por seguridad (no se pueden modificar directamente).
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo interceptamos peticiones que van a la API de TMDB
  if (req.url.includes(environment.tmdbApiUrl)) {
    const authReq = req.clone({
      setParams: {
        api_key: environment.tmdbApiKey,
        language: 'es-ES'
      }
    });
    return next(authReq);
  }
  return next(req);
};
