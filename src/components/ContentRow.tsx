"use client";
 
import React, { useRef } from "react";
import PosterCard from "./PosterCard";
import { MediaItem } from "@/lib/tmdb";
import { ChevronLeft, ChevronRight } from "lucide-react";
 
interface ContentRowProps {
  title: string;
  items: MediaItem[];
  centered?: boolean;
}
 
const ContentRow: React.FC<ContentRowProps> = ({ title, items, centered = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
 
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -500 : 500;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
 
  return (
    <div style={{ marginBottom: "64px" }} className="animate-fade-in">
      <div 
        style={{ padding: centered ? "0" : "0 60px", marginBottom: "24px" }} 
        className={`flex items-center ${centered ? 'justify-center' : 'justify-between'}`}
      >
        <div className={`flex items-center gap-4 ${centered ? 'justify-center' : ''}`}>
          <div style={{ 
            width: "4px", 
            height: "28px", 
            background: "var(--primary)", 
            borderRadius: "2px"
          }} />
          <h3 className="text-2xl font-black" style={{ 
            color: "rgba(255,255,255,0.95)", 
            letterSpacing: "0.02em",
            margin: 0
          }}>
            {title}
          </h3>
          <span className="badge" style={{ marginLeft: "8px" }}>
            {items.length}+ TITLES
          </span>
        </div>
        
        {!centered && (
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
        )}
      </div>
 
      <div 
        ref={scrollRef}
        className="poster-row"
        style={{ 
          padding: centered ? "20px 0 40px 0" : "20px 80px 40px 80px",
          maskImage: centered ? "none" : "linear-gradient(to right, transparent, black 120px)",
          WebkitMaskImage: centered ? "none" : "linear-gradient(to right, transparent, black 120px)",
          justifyContent: centered ? "center" : "flex-start"
        }}
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
