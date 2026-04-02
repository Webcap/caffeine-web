"use client";

import React from "react";
import Image from "next/image";
import { 
  Play, 
  Info, 
  Star, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Share2,
  BookmarkPlus,
  CheckCircle2,
  History
} from "lucide-react";
import { MediaItem } from "@/lib/tmdb";
import ContentRow from "@/components/ContentRow";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface TitleClientProps {
  details: MediaItem;
  recommendations: MediaItem[];
  collection?: MediaItem[];
}

const TitleClient: React.FC<TitleClientProps> = ({ details, recommendations, collection = [] }) => {
  const router = useRouter();
  const [watchHistory, setWatchHistory] = useState<{ timesWatched: number, lastWatchedAt: string | null } | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  
  useEffect(() => {
    const fetchWatchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: history } = await supabase
        .from('completed_watch_history')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('media_id', details.id);

      if (history && history.length > 0) {
        const totalTimes = history.reduce((acc: number, curr: any) => acc + (curr.times_watched || 0), 0);
        const latestTime = new Date(Math.max(...history.map((h: any) => new Date(h.updated_at).getTime()))).toISOString();
        setWatchHistory({ timesWatched: totalTimes, lastWatchedAt: latestTime });
      }
    };

    fetchWatchHistory();
  }, [details.id, details.media_type, details.title]);
  
  const backdropUrl = details.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` 
    : null;

  const posterUrl = details.poster_path 
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
    : "/assets/posters/placeholder.jpg";

  const formatRuntime = (minutes: number | null | undefined) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: 0, width: "100%" }}>
        {/* Hero Backdrop */}
        <div className="hero" style={{ height: "70vh" }}>
          {backdropUrl && (
            <Image 
              src={backdropUrl}
              alt={details.title}
              fill
              className="hero-img"
              style={{ objectFit: "cover", opacity: 0.4 }}
              priority
            />
          )}
          <div className="hero-overlay-dark" />
          <div className="hero-overlay-glass" />
          
          <div style={{ 
            position: "absolute", 
            top: "40px", 
            left: "40px", 
            zIndex: 100 
          }}>
            <button 
              onClick={() => router.back()}
              className="nav-icon"
              style={{ padding: "12px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)" }}
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div style={{ 
          marginTop: "-25vh", 
          position: "relative", 
          zIndex: 20, 
          padding: "0 80px 80px 80px",
          display: "flex",
          gap: "60px",
          alignItems: "flex-start"
        }}>
           {/* Poster Card */}
           <div className="animate-fade-in" style={{ flexShrink: 0, width: "350px" }}>
              <div style={{ 
                borderRadius: "24px", 
                overflow: "hidden", 
                border: "1px solid var(--glass-border-bright)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
              }}>
                 <Image 
                   src={posterUrl}
                   alt={details.title}
                   width={350}
                   height={525}
                   style={{ objectFit: "cover", width: "100%", height: "auto", display: "block" }}
                   priority
                 />
              </div>
           </div>

           {/* Details Details */}
           <div className="animate-fade-in" style={{ flex: 1, paddingTop: "80px" }}>
              <div className="flex items-center gap-4">
                 <div className="badge">{details.media_type?.toUpperCase()}</div>
                 {details.genres?.map((genre, i) => (
                   <span key={i} style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontWeight: 600 }}>
                     {genre}
                     {i < (details.genres?.length || 0) - 1 ? " • " : ""}
                   </span>
                 ))}
              </div>

              <h1 className="text-7xl font-black" style={{ marginTop: "20px", marginBottom: "16px" }}>
                {details.title}
              </h1>

              <div className="flex flex-col gap-4" style={{ marginBottom: "32px" }}>
                {details.tagline && (
                  <p style={{ fontSize: "1.4rem", fontStyle: "italic", color: "var(--text-muted)", opacity: 0.8 }}>
                    "{details.tagline}"
                  </p>
                )}

                {watchHistory && (
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px", 
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.95rem",
                    fontWeight: 600
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <History size={16} />
                      <span>Watched {watchHistory.timesWatched} {watchHistory.timesWatched === 1 ? 'time' : 'times'}</span>
                    </div>
                    {watchHistory.lastWatchedAt && (
                      <>
                        <span style={{ opacity: 0.3 }}>•</span>
                        <span>Last watched {new Date(watchHistory.lastWatchedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-8" style={{ marginBottom: "40px" }}>
                 <div className="flex items-center gap-2" style={{ color: "#fbbf24", fontSize: "1.1rem", fontWeight: 800 }}>
                    <Star size={20} fill="currentColor" />
                    {details.vote_average?.toFixed(1)}
                 </div>
                 
                 <div className="flex items-center gap-2" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                    <Calendar size={18} />
                    {details.release_date ? new Date(details.release_date).getFullYear() : 'N/A'}
                 </div>

                 {details.runtime && (
                   <div className="flex items-center gap-2" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                      <Clock size={18} />
                      {formatRuntime(details.runtime)}
                   </div>
                 )}

                 {details.number_of_seasons && (
                   <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                      {details.number_of_seasons} Seasons
                   </div>
                 )}
              </div>

              <div className="glass-card" style={{ padding: "32px", marginBottom: "48px" }}>
                 <h2 className="text-xl font-bold" style={{ marginBottom: "16px" }}>Overview</h2>
                 <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "rgba(255,255,255,0.8)" }}>
                    {details.overview || "No description available."}
                 </p>
              </div>

              <div className="flex items-center gap-6">
                 <button 
                  onClick={() => setShowPlayer(true)}
                  className="btn-primary" 
                  style={{ padding: "20px 60px", fontSize: "1.2rem", borderRadius: "20px" }}
                >
                    <Play size={24} fill="currentColor" />
                    Watch Now
                 </button>
                 <button className="btn-secondary" style={{ padding: "20px 32px", borderRadius: "20px" }}>
                    <BookmarkPlus size={24} />
                 </button>
                 <button className="btn-secondary" style={{ padding: "20px 32px", borderRadius: "20px" }}>
                    <Share2 size={24} />
                 </button>
              </div>
           </div>
        </div>

        {/* Collection Section */}
        {collection.length > 0 && (
          <div style={{ marginTop: "60px" }}>
             <ContentRow 
               title={`More from the ${details.belongs_to_collection?.name || 'Series'}`}
               items={collection} 
             />
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: collection.length > 0 ? "20px" : "40px" }}>
             <ContentRow 
               title="You Might Also Like" 
               items={recommendations.slice(0, 10)} 
             />
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer 
          id={details.id}
          type={details.media_type === "tv" ? "tv" : "movie"}
          title={details.title}
          releaseDate={details.release_date}
          backdropPath={details.backdrop_path}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

export default TitleClient;
