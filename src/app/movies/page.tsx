import { 
  getTrendingMovies, 
  getPopularMovies, 
  getTopRatedMovies 
} from "@/lib/tmdb";
import MoviesClient from "@/app/movies/MoviesClient";

export const metadata = {
  title: "Movies | Caffeine",
  description: "Discover the latest and greatest films on Caffeine.",
};

export default async function MoviesPage() {
  const [trending, popular, topRated] = await Promise.all([
    getTrendingMovies(),
    getPopularMovies(),
    getTopRatedMovies(),
  ]);

  return (
    <MoviesClient 
      trending={trending} 
      popular={popular} 
      topRated={topRated} 
    />
  );
}
