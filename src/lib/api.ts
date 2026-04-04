import { getTvSeason } from "./tmdb";

const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine.synqholdings.com";

export interface StreamLink {
  url: string;
  quality?: string;
  headers?: Record<string, string>;
}

export interface StreamResponse {
  success: boolean;
  provider: string;
  links: StreamLink[];
}

/**
 * Encodes a string to base64url format (URL-safe base64)
 */
function b64EncodeUnicode(str: string) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
}

/**
 * Wraps a direct stream URL in the Caffeine API proxy to handle CORS and IP-locking.
 */
export function wrapInProxy(url: string, headers: Record<string, string> = {}): string {
  if (url.includes("/proxy/stream")) return url; // Already proxied
  
  const encodedUrl = b64EncodeUnicode(url);
  const encodedHeaders = b64EncodeUnicode(JSON.stringify(headers));
  
  // Append a hint for players like hls.js to recognize the format
  const extension = url.split('?')[0].endsWith('.m3u8') ? '/video.m3u8' : '';
  
  return `${API_URL}/proxy/stream${extension}?url=${encodedUrl}&headers=${encodedHeaders}`;
}

export async function fetchStreamLinks(
  tmdbId: string | number,
  type: "movie" | "tv",
  season?: number,
  episode?: number
): Promise<StreamResponse | null> {
  const provider = "vidlink"; 
  const endpoint = type === "movie" 
    ? `${API_URL}/${provider}/stream-movie?tmdbId=${tmdbId}`
    : `${API_URL}/${provider}/stream-tv?tmdbId=${tmdbId}&season=${season}&episode=${episode}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    
    // Auto-proxy all links returned by the API
    if (data && data.links) {
      data.links = data.links.map((link: StreamLink) => ({
        ...link,
        url: wrapInProxy(link.url, link.headers || {})
      }));
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch stream links:", error);
    return null;
  }
}

export async function fetchEpisodes(tmdbId: string | number, season: number) {
  try {
    return await getTvSeason(tmdbId, season);
  } catch (error) {
    console.error("Failed to fetch episodes:", error);
    return [];
  }
}
