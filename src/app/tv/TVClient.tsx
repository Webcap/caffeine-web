"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ContentRow from "@/components/ContentRow";
import { MediaItem, getTvSeason, getTvDetails } from "@/lib/tmdb";
import { supabase } from "@/lib/supabase";

interface TVClientProps {
  trending: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
}

const TVClient: React.FC<TVClientProps> = ({ trending, popular, topRated }) => {
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [upNext, setUpNext] = useState<MediaItem[]>([]);
  const featured = trending[0];

  useEffect(() => {
    const fetchHistoryAndUpNext = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('continue_watching_history')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('media_type', 'tv')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        console.log("[TV HUB] 📜 History fetched:", data.length, "items");
        
        // --- 1. Process Continue Watching ---
        const deduped: MediaItem[] = [];
        const seenIds = new Set<string | number>();
        const completedShows: any[] = [];

        for (const item of data) {
          const progress = (item.elapsed_ms || 0) / (item.duration_ms || 1);
          
          if (!seenIds.has(item.media_id)) {
            seenIds.add(item.media_id);
            
            // Logic: If user is halfway through, it's Continue Watching.
            // If they are near the end (>90%) OR explicitly completed, suggest the NEXT episode in Up Next.
            if (!item.is_completed && progress < 0.9) {
              deduped.push({
                id: item.media_id,
                title: item.title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                media_type: item.media_type,
                progress: progress,
              });
            } else {
              completedShows.push(item);
            }
          }
        }
        setContinueWatching(deduped);
        console.log("[TV HUB] ✅ Continue Watching:", deduped.length, "| Completed Shows Candidates:", completedShows.length);

        // --- 2. Process Up Next (Next Episode) ---
        const nextItems: MediaItem[] = [];
        const now = new Date();

        for (const show of completedShows.slice(0, 10)) {
          try {
            const seasonNum = show.season_num || 1;
            const epNum = show.episode_num || 1;
            
            console.log(`[TV HUB] 🔍 Calculating Up Next for: ${show.title} (S${seasonNum}E${epNum})`);

            // Check current season
            const seasonData = await getTvSeason(show.media_id, seasonNum);
            let nextEp = seasonData.episodes?.find((e: any) => e.episode_number === epNum + 1);

            if (nextEp) {
              const airDate = nextEp.air_date ? new Date(nextEp.air_date) : null;
              if (!airDate || airDate <= now) {
                console.log(`[TV HUB] ✨ Found Next Ep: ${show.title} S${seasonNum}E${nextEp.episode_number}`);
                nextItems.push({
                  id: show.media_id,
                  title: show.title,
                  poster_path: show.poster_path,
                  backdrop_path: nextEp.still_path || show.backdrop_path,
                  media_type: 'tv',
                  episode_name: nextEp.name,
                  season_num: seasonNum,
                  episode_num: nextEp.episode_number,
                });
                continue;
              }
            }

            // Check next season
            const showDetails = await getTvDetails(show.media_id);
            if (seasonNum < (showDetails.number_of_seasons || 0)) {
              const nextSeasonData = await getTvSeason(show.media_id, seasonNum + 1);
              const firstEp = nextSeasonData.episodes?.[0];
              if (firstEp) {
                const airDate = firstEp.air_date ? new Date(firstEp.air_date) : null;
                if (!airDate || airDate <= now) {
                   console.log(`[TV HUB] ✨ Found Next Season Ep: ${show.title} S${seasonNum + 1}E1`);
                   nextItems.push({
                    id: show.media_id,
                    title: show.title,
                    poster_path: show.poster_path,
                    backdrop_path: firstEp.still_path || show.backdrop_path,
                    media_type: 'tv',
                    episode_name: firstEp.name,
                    season_num: seasonNum + 1,
                    episode_num: firstEp.episode_number,
                  });
                }
              }
            }
          } catch (err) {
            console.error(`[TV HUB] ❌ Error fetching next ep for ${show.title}:`, err);
          }
        }
        
        console.log("[TV HUB] 🏁 Final Up Next Items:", nextItems.length);
        setUpNext(nextItems);
      }
    };

    fetchHistoryAndUpNext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchHistoryAndUpNext();
      } else {
        setContinueWatching([]);
        setUpNext([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <Sidebar />
      
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
        <div className="aurora aurora-2" />
      </div>

      <main className="main-content">
        {/* TV Hero Section */}
        <section className="hero" style={{ height: "70vh" }}>
          {featured && (
            <>
              <Image 
                src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`} 
                alt={featured.title}
                fill
                className="hero-img"
                style={{ objectFit: "cover", opacity: 0.4 }}
                priority
              />
              <div className="hero-overlay-dark" />
              <div className="hero-content animate-fade-in" style={{ bottom: "80px" }}>
                <div className="flex items-center gap-4">
                  <div className="badge" style={{ backgroundColor: "#8b5cf6", borderColor: "rgba(139, 92, 246, 0.3)" }}>
                    TV HUB
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 800 }}>
                    <TrendingUp size={16} />
                    <span>POPULAR SERIES</span>
                  </div>
                </div>

                <h1 className="text-6xl font-black" style={{ marginTop: "24px", marginBottom: "20px" }}>
                  {featured.title}
                </h1>

                <p className="text-lg text-muted line-clamp-2" style={{ maxWidth: "600px", color: "rgba(255,255,255,0.6)" }}>
                  {featured.overview}
                </p>

                <div className="flex items-center gap-4" style={{ marginTop: "32px" }}>
                  <Link href={`/title/tv/${featured.id}`}>
                    <button className="btn-primary" style={{ padding: "14px 32px", borderRadius: "14px" }}>
                      <Play fill="currentColor" size={20} />
                      Watch Now
                    </button>
                  </Link>
                  <Link href={`/title/tv/${featured.id}`}>
                    <button className="btn-secondary" style={{ padding: "14px 32px", borderRadius: "14px" }}>
                      <Info size={20} />
                      More Info
                    </button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Categories */}
        <div style={{ marginTop: "-80px", position: "relative", zIndex: 20, paddingBottom: "100px" }}>
          {continueWatching.length > 0 && (
            <ContentRow title="Continue Watching" items={continueWatching} />
          )}
          {upNext.length > 0 && (
            <ContentRow title="Up Next" items={upNext} />
          )}
          <ContentRow title="Trending This Week" items={trending} />
          <ContentRow title="Popular Shows" items={popular} />
          <ContentRow title="Top Rated Series" items={topRated} />
        </div>
      </main>
    </div>
  );
};

export default TVClient;
