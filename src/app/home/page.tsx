import HomeClient from "./HomeClient";
import { getTrendingAll, getTrendingMovies, getTrendingTV, MediaItem } from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  let recommendations: MediaItem[] = [];
  let featureFlags = {};

  try {
    const env = process.env.NODE_ENV === "development" ? "development" : "production";
    
    // Fetch TMDB data and feature flags in parallel
    const [trending, movies, tv, flagsRes] = await Promise.all([
      getTrendingAll(),
      getTrendingMovies(),
      getTrendingTV(),
      fetch(`${API_URL}/v1/feature-flags?platform=web&env=${env}`, { cache: 'no-store' }).catch(() => null)
    ]);

    // Use trending items first, then movies/tv for variety
    recommendations = [...trending, ...movies, ...tv];
    
    // De-duplicate the combined list
    const seen = new Set();
    recommendations = recommendations.filter(item => {
       if (seen.has(item.id)) return false;
       seen.add(item.id);
       return true;
    });

    if (flagsRes && flagsRes.ok) {
       featureFlags = await flagsRes.json();
    }

  } catch (e) {
    console.error("Failed to fetch initial home data:", e);
  }

  return (
    <HomeClient 
      initialRecommendations={recommendations} 
      featureFlags={featureFlags}
    />
  );
}
