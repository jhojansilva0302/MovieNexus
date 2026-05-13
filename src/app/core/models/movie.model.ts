export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count?: number;
  release_date: string;
  genre_ids?: number[];
}

export interface MovieResponse {
  results: Movie[]; // La API nos devuelve una lista de películas
  page: number;
  total_pages: number;
}

// Interfaz para el detalle completo de una película
export interface MovieDetail extends Movie {
  genres: Genre[];
  runtime: number | null;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_companies: ProductionCompany[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}
