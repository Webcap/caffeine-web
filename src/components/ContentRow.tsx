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
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
 
  return (
    <div style={{ marginBottom: "48px" }} className="animate-fade-in">
      <div style={{ padding: "0 40px", marginBottom: "16px" }} className="flex items-center justify-between">
        <h3 className="text-xl font-black" style={{ color: "rgba(255,255,255,0.9)" }}>
           {title}
        </h3>
        
        <div className="flex gap-2">
           <button 
             onClick={() => scroll("left")}
             className="nav-icon"
             style={{ padding: "8px", borderRadius: "50%" }}
           >
             <ChevronLeft size={20} />
           </button>
           <button 
             onClick={() => scroll("right")}
             className="nav-icon"
             style={{ padding: "8px", borderRadius: "50%" }}
           >
             <ChevronRight size={20} />
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
               <PosterCard item={item} priority={i < 5} />
             </div>
           ))
        ) : (
           Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="media-card" style={{ animation: "fadeIn 1s infinite alternate", background: "rgba(255,255,255,0.02)", borderRadius: "12px", height: "300px" }} />
           ))
        )}
      </div>
    </div>
  );
};
 
export default ContentRow;
