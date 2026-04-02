export interface MediaItem {
  id: number | string;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
  overview?: string;
  
  // Extra fields for details page
  genres?: string[];
  runtime?: number | null;
  status?: string;
  tagline?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  last_air_date?: string;
  
  // Continue Watching / Progress fields
  progress?: number; // 0 to 1
  elapsed_ms?: number;
  duration_ms?: number;
  episode_name?: string;
  season_num?: number;
  episode_num?: number;

  // Collection fields
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  } | null;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchTMDB(endpoint: string) {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY is not defined");
    return { results: [] };
  }

  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to fetch from TMDB: ${res.status} ${res.statusText}`);
      return { results: [] };
    }
    return res.json();
  } catch (error) {
    console.error("TMDB fetch error:", error);
    return { results: [] };
  }
}

export function normalizeMediaItem(item: any, type?: string): MediaItem {
  return {
    id: item.id,
    title: item.title || item.name || "Untitled",
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date || item.first_air_date,
    media_type: item.media_type || type || (item.name ? "tv" : "movie"),
    overview: item.overview,
  };
}

export async function getTrendingAll(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/trending/all/day");
  return (data.results || []).map((item: any) => normalizeMediaItem(item));
}

export async function getTrendingMovies(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/trending/movie/day");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "movie"));
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/movie/popular");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "movie"));
}

export async function getTopRatedMovies(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/movie/top_rated");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "movie"));
}

export async function getTrendingTV(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/trending/tv/day");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "tv"));
}

export async function getPopularTV(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/tv/popular");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "tv"));
}

export async function getTopRatedTV(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/tv/top_rated");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "tv"));
}

export async function getMediaDetails(id: string | number, type: string): Promise<MediaItem | null> {
  const data = await fetchTMDB(`/${type}/${id}`);
  if (!data || !data.id) return null;
  
  const item = normalizeMediaItem(data, type);
  // Add extra fields for details page
  return {
    ...item,
    genres: data.genres?.map((g: any) => g.name) || [],
    runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null),
    status: data.status,
    tagline: data.tagline,
    number_of_seasons: data.number_of_seasons,
    number_of_episodes: data.number_of_episodes,
    last_air_date: data.last_air_date,
    belongs_to_collection: data.belongs_to_collection,
  };
}

export async function getRecommendations(id: string | number, type: string): Promise<MediaItem[]> {
  const data = await fetchTMDB(`/${type}/${id}/recommendations`);
  return (data.results || []).map((item: any) => normalizeMediaItem(item, type));
}

export async function getCollectionDetails(id: string | number): Promise<MediaItem[]> {
  const data = await fetchTMDB(`/collection/${id}`);
  if (!data || !data.parts) return [];
  
  return (data.parts || []).map((item: any) => normalizeMediaItem(item, "movie"));
}

export async function getTvSeason(id: string | number, seasonNumber: number): Promise<any> {
  const data = await fetchTMDB(`/tv/${id}/season/${seasonNumber}`);
  return data;
}

export async function getTvDetails(id: string | number): Promise<any> {
  const data = await fetchTMDB(`/tv/${id}`);
  return data;
}
