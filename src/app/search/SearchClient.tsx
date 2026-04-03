"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Play, Film, Tv, TrendingUp, X, Star } from "lucide-react";
import { MediaItem, searchMedia } from "@/lib/tmdb";
import PosterCard from "@/components/PosterCard";
import ContentRow from "@/components/ContentRow";
import { useSearchParams, useRouter } from "next/navigation";

interface SearchClientProps {
  trendingMovies: MediaItem[];
  trendingTV: MediaItem[];
}

export default function SearchClient({ trendingMovies, trendingTV }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"multi" | "movie" | "tv">("multi");
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  
  const debounceTimer = useRef<any>(null);

  const performSearch = async (searchQuery: string, type: "multi" | "movie" | "tv") => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const data = await searchMedia(searchQuery, type);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, activeTab);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      performSearch(val, activeTab);
      // Update URL without refreshing
      const params = new URLSearchParams(window.location.search);
      if (val) params.set("q", val);
      else params.delete("q");
      window.history.replaceState(null, "", `?${params.toString()}`);
    }, 400);
  };

  const handleTabChange = (tab: "multi" | "movie" | "tv") => {
    setActiveTab(tab);
    if (query) {
      performSearch(query, tab);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("q");
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" style={{ opacity: 0.1 }} />
        <div className="aurora aurora-3" style={{ opacity: 0.05 }} />
      </div>

      <div className="search-content-wrapper">
        {/* Hero Section */}
        <section className="search-hero">
          <div className="animate-fade-in">
            <h1 className="text-5xl font-black gradient-text">Discovery</h1>
            <p className="text-muted mt-4 font-medium tracking-wide">
              Explore thousands of movies, series, and live events.
            </p>
          </div>

          <div className="search-bar-container animate-slide-up">
            <input
              type="text"
              className="search-bar-glass"
              placeholder="Search for titles, genres, or people..."
              value={query}
              onChange={handleInputChange}
              autoFocus
            />
            <Search className="search-icon-float" size={28} />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-muted hover:text-white" />
              </button>
            )}
          </div>

          <div className="search-tabs animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <button 
              className={`search-tab ${activeTab === 'multi' ? 'active' : ''}`}
              onClick={() => handleTabChange('multi')}
            >
              All Results
            </button>
            <button 
              className={`search-tab ${activeTab === 'movie' ? 'active' : ''}`}
              onClick={() => handleTabChange('movie')}
            >
              Movies
            </button>
            <button 
              className={`search-tab ${activeTab === 'tv' ? 'active' : ''}`}
              onClick={() => handleTabChange('tv')}
            >
              TV Series
            </button>
          </div>
        </section>

        {/* Results Section */}
        <section className="results-section" style={{ padding: "0 0 80px 0" }}>
          {loading ? (
            <div className="empty-state">
              <Loader2 size={48} className="animate-spin text-primary opacity-50" />
              <p className="text-lg font-bold tracking-widest uppercase opacity-40">Searching the multiverse...</p>
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="results-grid">
                {results.map((item, i) => (
                  <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${Math.random() * 0.2}s` }}>
                    <PosterCard item={item} priority={i < 4} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search size={32} className="opacity-20" />
                </div>
                <h2 className="text-2xl font-bold text-white">No matches found</h2>
                <p className="max-w-md mx-auto">
                  We couldn't find anything matching "{query}". <br/>
                  Try different keywords or check for spelling errors.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-12 animate-fade-in flex flex-col items-center">
              <div className="flex flex-col items-center gap-12 w-full">
                <div className="flex items-center gap-3">
                  <TrendingUp size={24} className="text-primary" />
                  <h2 className="text-2xl font-black">Trending Now</h2>
                </div>
                
                <div className="w-full">
                  <ContentRow 
                    title="Global Trends" 
                    items={trendingMovies.slice(0, 10)} 
                    centered={true}
                  />
                </div>
                
                <div className="w-full">
                  <ContentRow 
                    title="Top Rated TV" 
                    items={trendingTV.slice(0, 10)} 
                    centered={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                 {[
                   { label: "Action", icon: <Play size={18}/>, color: "var(--primary)" },
                   { label: "Anime", icon: <Star size={18}/>, color: "var(--accent-blue)" },
                   { label: "Comedy", icon: <Film size={18}/>, color: "#10b981" },
                   { label: "Horror", icon: <Tv size={18}/>, color: "#8b5cf6" }
                 ].map((cat, i) => (
                   <div key={i} className="glass-card p-8 flex items-center justify-between group cursor-pointer">
                      <span className="text-xl font-bold group-hover:text-white transition-colors">{cat.label}</span>
                      <div style={{ color: cat.color }} className="opacity-50 group-hover:opacity-100 transition-opacity">
                        {cat.icon}
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
