export interface MediaItem {
  id: number | string;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
  overview?: string;
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

export async function getTrendingTV(): Promise<MediaItem[]> {
  const data = await fetchTMDB("/trending/tv/day");
  return (data.results || []).map((item: any) => normalizeMediaItem(item, "tv"));
}
