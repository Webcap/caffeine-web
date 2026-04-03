"use client";
 
import { MediaItem } from "@/lib/tmdb";
import Image from "next/image";
import { Play, Star, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
 
interface PosterCardProps {
  item: MediaItem;
  priority?: boolean;
}
 
const PosterCard: React.FC<PosterCardProps> = ({ item, priority = false }) => {
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWatchedStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('completed_watch_history')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('media_id', item.id)
        .maybeSingle();

      if (data && !error) {
        setIsWatched(true);
      }
    };

    checkWatchedStatus();
  }, [item.id]);

  const handleToggleWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert("Please log in to track your viewing history!");
      setLoading(false);
      return;
    }

    if (isWatched) {
      // Remove from history
      const { error } = await supabase
        .from('completed_watch_history')
        .delete()
        .eq('user_id', session.user.id)
        .eq('media_id', item.id);
      
      if (!error) setIsWatched(false);
    } else {
      // Add to history
      const { error } = await supabase
        .from('completed_watch_history')
        .insert({
          user_id: session.user.id,
          media_id: item.id,
          media_type: item.media_type || (item.title ? 'movie' : 'tv'),
          title: item.title,
          poster_path: item.poster_path,
          times_watched: 1,
          updated_at: new Date().toISOString()
        });
      
      if (!error) setIsWatched(true);
    }
    setLoading(false);
  };

  const imageUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
    : "/assets/posters/placeholder.jpg";
 
  const detailUrl = `/title/${item.media_type || (item.title ? 'movie' : 'tv')}/${item.id}`;

  return (
    <Link href={detailUrl} className="media-card" style={{ display: "block" }}>
      <div className="media-thumbnail-container">
        <Image 
          src={imageUrl} 
          alt={item.title}
          fill
          className="poster-img"
          priority={priority}
          sizes="(max-width: 768px) 50vw, 210px"
        />
 
        <div className="media-overlay">
           <div style={{ 
             background: "#fff", 
             padding: "14px", 
             borderRadius: "50%", 
             color: "#000", 
             boxShadow: "0 10px 25px rgba(0,0,0,0.5)", 
             display: "flex",
             transform: "scale(1.1)",
             marginBottom: "16px"
           }}>
             <Play size={24} fill="currentColor" />
           </div>
           
           <div className="flex items-center gap-3">
              <button className="nav-icon" style={{ padding: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                 <Plus size={18} />
              </button>
              <button 
                onClick={handleToggleWatched}
                disabled={loading}
                className="nav-icon" 
                style={{ 
                  padding: "10px", 
                  borderRadius: "50%", 
                  background: isWatched ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.1)", 
                  border: isWatched ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.2)",
                  color: isWatched ? "var(--win-green)" : "#fff"
                }}
              >
                 <CheckCircle2 size={18} fill={isWatched ? "currentColor" : "none"} />
              </button>
            </div>
        </div>
 
        {item.vote_average && item.vote_average > 0 && (
          <div style={{ 
            position: "absolute", 
            top: "14px", 
            left: "14px", 
            zIndex: 25, 
            display: "flex", 
            alignItems: "center", 
            gap: "5px", 
            background: "rgba(11, 11, 11, 0.7)", 
            padding: "5px 10px", 
            borderRadius: "8px", 
            fontSize: "11px", 
            fontWeight: 800, 
            color: "#fbbf24", 
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}>
            <Star size={12} fill="currentColor" />
            {item.vote_average.toFixed(1)}
          </div>
        )}

        {isWatched && (
          <div style={{ 
            position: "absolute", 
            top: "14px", 
            right: "14px", 
            zIndex: 25, 
            background: "rgba(16, 185, 129, 0.9)", 
            color: "#fff",
            padding: "6px", 
            borderRadius: "50%", 
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
            display: "flex"
          }}>
            <CheckCircle2 size={14} fill="currentColor" />
          </div>
        )}

        {item.progress !== undefined && (
          <div style={{ 
            position: "absolute", 
            bottom: "0", 
            left: "0", 
            width: "100%", 
            height: "4px", 
            background: "rgba(255,255,255,0.2)",
            zIndex: 30
          }}>
            <div style={{ 
              width: `${Math.min(100, Math.max(0, item.progress * 100))}%`, 
              height: "100%", 
              background: "var(--primary)",
              boxShadow: "0 0 10px var(--primary)"
            }} />
          </div>
        )}
      </div>
  
      <div style={{ marginTop: "16px" }} className="flex flex-col gap-1">
        <h4 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.95)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted" style={{ fontWeight: 600 }}>
           <span style={{ textTransform: "uppercase", letterSpacing: "0.02em" }}>
             {item.media_type === 'tv' ? 'Series' : 'Movie'}
           </span>
           {item.release_date && (
             <>
               <span style={{ opacity: 0.4 }}>•</span>
               <span>{new Date(item.release_date).getFullYear()}</span>
             </>
           )}
        </div>
      </div>
    </Link>
  );
};
 
export default PosterCard;
