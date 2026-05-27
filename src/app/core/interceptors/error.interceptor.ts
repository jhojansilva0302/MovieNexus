import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente o de la red
        errorMessage = `Error de red: ${error.error.message}`;
      } else {
        // Errores HTTP del lado del servidor
        switch (error.status) {
          case 400:
            errorMessage = 'Petición incorrecta (400)';
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor verifica tus credenciales (401)';
            break;
          case 403:
            errorMessage = 'Prohibido. No tienes acceso a este recurso (403)';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado (404)';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Por favor intenta más tarde (500)';
            break;
          default:
            errorMessage = `Error del servidor: ${error.status} - ${error.statusText || error.message}`;
        }
      }

      console.error('--- HTTP ERROR INTERCEPTED ---');
      console.error(`URL: ${req.url}`);
      console.error(`Status: ${error.status}`);
      console.error(`Message: ${errorMessage}`);
      console.error(error);
      
      // Lanzamos el error con un mensaje formateado y descriptivo
      return throwError(() => new Error(errorMessage));
    })
  );
};
