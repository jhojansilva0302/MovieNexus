const fs = require('fs');
const path = require('path');

// Directorio y archivos destino
const envDir = path.join(__dirname, 'src', 'environments');
const envFile = path.join(envDir, 'environment.ts');
const devEnvFile = path.join(envDir, 'environment.development.ts');

// Asegurar que el directorio de ambientes exista
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Obtener API Key de las variables de entorno o usar un fallback
const apiKey = process.env.API_KEY || 'ccf3907854534f675d18ad5201cbea00';
const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjY2YzOTA3ODU0NTM0ZjY3NWQxOGFkNTIwMWNiZWEwMCIsIm5iZiI6MTcyNDM1NDM0ODU0NSwiZWF0IjoxNzI0MzU0MzQ4NTQ1LCJqdGkiOiI0NDM4NGU4NC03NDI5LTRhNDYtYjliMS03NTM1Y2ZkODUzOTYifQ.cbH91cf54i3dXvZrtyheCb5cAskJ5kenclifGDduU-VY';

// Contenido para environment.ts (Producción)
const envConfigFile = `export const environment = {
  production: true,
  baseUrl: 'https://api.themoviedb.org/3',
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbImageUrl: 'https://image.tmdb.org/t/p',
  apiKey: '${apiKey}',
  tmdbApiKey: '${apiKey}',
  tmdbAccessToken: '${tmdbAccessToken}'
};
`;

// Contenido para environment.development.ts (Desarrollo)
const devEnvConfigFile = `export const environment = {
  production: false,
  baseUrl: 'https://api.themoviedb.org/3',
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbImageUrl: 'https://image.tmdb.org/t/p',
  apiKey: '${apiKey}',
  tmdbApiKey: '${apiKey}',
  tmdbAccessToken: '${tmdbAccessToken}'
};
`;

console.log('====================================');
console.log('Generando archivos de entorno de Angular...');
console.log(`Path Producción: ${envFile}`);
console.log(`Path Desarrollo: ${devEnvFile}`);

try {
  fs.writeFileSync(envFile, envConfigFile, 'utf8');
  fs.writeFileSync(devEnvFile, devEnvConfigFile, 'utf8');
  console.log('¡Archivos de entorno generados con éxito!');
  console.log('====================================');
} catch (err) {
  console.error('Error al generar los archivos de entorno:', err);
  console.log('====================================');
  process.exit(1);
}
