"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ContentRow from "@/components/ContentRow";
import { MediaItem } from "@/lib/tmdb";

interface TVClientProps {
  trending: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
}

const TVClient: React.FC<TVClientProps> = ({ trending, popular, topRated }) => {
  const featured = trending[0];

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
          <ContentRow title="Trending This Week" items={trending} />
          <ContentRow title="Popular Shows" items={popular} />
          <ContentRow title="Top Rated Series" items={topRated} />
        </div>
      </main>
    </div>
  );
};

export default TVClient;
