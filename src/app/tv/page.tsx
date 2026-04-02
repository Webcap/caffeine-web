import { 
  getTrendingTV, 
  getPopularTV, 
  getTopRatedTV 
} from "@/lib/tmdb";
import TVClient from "./TVClient";

export const metadata = {
  title: "TV Shows | Caffeine",
  description: "Browse the best TV series and shows on Caffeine.",
};

export default async function TVPage() {
  const [trending, popular, topRated] = await Promise.all([
    getTrendingTV(),
    getPopularTV(),
    getTopRatedTV(),
  ]);

  return (
    <TVClient 
      trending={trending} 
      popular={popular} 
      topRated={topRated} 
    />
  );
}
