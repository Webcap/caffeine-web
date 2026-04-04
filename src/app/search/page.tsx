import { getTrendingMovies, getTopRatedTV } from "@/lib/tmdb";
import SearchClient from "./SearchClient";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Discovery | Caffeine Web",
  description: "Search for the latest movies and TV series on Caffeine.",
};

export default async function SearchPage() {
  const [trendingMovies, trendingTV] = await Promise.all([
    getTrendingMovies(),
    getTopRatedTV(),
  ]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        <SearchClient 
          trendingMovies={trendingMovies} 
          trendingTV={trendingTV} 
        />
      </main>
    </div>
  );
}
