export async function getMovieQuality(tmdbId: string | number): Promise<string> {
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";
  try {
    const res = await fetch(`${API_URL}/scraper/quality/${tmdbId}`);
    if (!res.ok) return "Unknown";
    const data = await res.json();
    return data.quality || "Unknown";
  } catch (error) {
    console.error("Quality fetch error:", error);
    return "Unknown";
  }
}
