"use client";
 
import React from "react";
import Image from "next/image";
import { Play, Star, Plus } from "lucide-react";
import Link from "next/link";
 
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
