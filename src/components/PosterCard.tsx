"use client";
 
import React from "react";
import Image from "next/image";
import { Play, Star, Info } from "lucide-react";
 
export interface MediaItem {
  id: number | string;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
  overview?: string;
}
 
interface PosterCardProps {
  item: MediaItem;
  priority?: boolean;
}
 
const PosterCard: React.FC<PosterCardProps> = ({ item, priority = false }) => {
  const imageUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
    : "/assets/posters/placeholder.jpg";
 
  return (
    <div className="media-card">
      <div className="media-thumbnail-container">
        <Image 
          src={imageUrl} 
          alt={item.title}
          fill
          className="poster-img"
          priority={priority}
          sizes="(max-width: 768px) 50vw, 200px"
        />
 
        <div className="media-overlay">
           <div style={{ background: "white", padding: "12px", borderRadius: "50%", color: "black", boxShadow: "var(--card-shadow)", display: "flex" }}>
             <Play size={24} fill="currentColor" />
           </div>
           
           <div className="flex items-center gap-2" style={{ marginTop: "12px" }}>
             <button className="btn-secondary" style={{ padding: "8px", borderRadius: "50%" }}>
                <Info size={16} />
             </button>
           </div>
        </div>
 
        {item.vote_average && item.vote_average > 0 && (
          <div style={{ 
            position: "absolute", 
            top: "12px", 
            right: "12px", 
            zIndex: 20, 
            display: "flex", 
            alignItems: "center", 
            gap: "4px", 
            background: "rgba(0,0,0,0.6)", 
            padding: "4px 8px", 
            borderRadius: "6px", 
            fontSize: "10px", 
            fontWeight: "bold", 
            color: "#fbbf24", 
            backdropFilter: "blur(8px)",
            border: "1px solid var(--glass-border)"
          }}>
            <Star size={10} fill="currentColor" />
            {item.vote_average.toFixed(1)}
          </div>
        )}
      </div>
 
      <div style={{ marginTop: "12px" }} className="flex flex-col gap-1">
        <h4 className="text-sm font-black" style={{ color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted">
           <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
             {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
           </span>
           {item.release_date && (
             <>
               <span>•</span>
               <span>{new Date(item.release_date).getFullYear()}</span>
             </>
           )}
        </div>
      </div>
    </div>
  );
};
 
export default PosterCard;
