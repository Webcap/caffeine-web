"use client";
 
import React, { useRef } from "react";
import PosterCard, { MediaItem } from "./PosterCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
 
interface ContentRowProps {
  title: string;
  items: MediaItem[];
}
 
const ContentRow: React.FC<ContentRowProps> = ({ title, items }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
 
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -500 : 500;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
 
  return (
    <div style={{ marginBottom: "64px" }} className="animate-fade-in">
      <div style={{ padding: "0 40px", marginBottom: "20px" }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div style={{ width: "4px", height: "32px", background: "var(--primary)", borderRadius: "2px" }} />
          <h3 className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "0.02em" }}>
             {title}
          </h3>
          <span className="badge" style={{ marginLeft: "8px" }}>
            {items.length}+ TITLES
          </span>
        </div>
        
        <div className="flex gap-3">
           <button 
             onClick={() => scroll("left")}
             className="nav-icon"
             style={{ padding: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
           >
             <ChevronLeft size={22} />
           </button>
           <button 
             onClick={() => scroll("right")}
             className="nav-icon"
             style={{ padding: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
           >
             <ChevronRight size={22} />
           </button>
        </div>
      </div>
 
      <div 
        ref={scrollRef}
        className="poster-row"
      >
        {items.length > 0 ? (
           items.map((item, i) => (
             <div key={item.id} style={{ display: "flex" }}>
               <PosterCard item={item} priority={i < 6} />
             </div>
           ))
        ) : (
           Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="media-card" style={{ opacity: 0.1 }}>
               <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", height: "300px", width: "100%" }} />
             </div>
           ))
        )}
      </div>
    </div>
  );
};
 
export default ContentRow;
