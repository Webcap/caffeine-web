"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Award } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ContentRow from "@/components/ContentRow";
import { MediaItem } from "@/lib/tmdb";

interface MoviesClientProps {
  trending: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
}

const MoviesClient: React.FC<MoviesClientProps> = ({ trending, popular, topRated }) => {
  const featured = trending[0];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <Sidebar />
      
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
      </div>

      <main className="main-content">
        {/* Movies Hero Section */}
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
                  <div className="badge" style={{ backgroundColor: "var(--primary)", borderColor: "rgba(220, 38, 38, 0.3)" }}>
                    BLOCKBUSTER
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 800 }}>
                    <Award size={16} />
                    <span>TOP TRENDING</span>
                  </div>
                </div>

                <h1 className="text-6xl font-black" style={{ marginTop: "24px", marginBottom: "20px" }}>
                  {featured.title}
                </h1>

                <p className="text-lg text-muted line-clamp-2" style={{ maxWidth: "600px", color: "rgba(255,255,255,0.6)" }}>
                  {featured.overview}
                </p>

                <div className="flex items-center gap-4" style={{ marginTop: "32px" }}>
                  <Link href={`/title/movie/${featured.id}`}>
                    <button className="btn-primary" style={{ padding: "14px 32px", borderRadius: "14px" }}>
                      <Play fill="currentColor" size={20} />
                      Watch Now
                    </button>
                  </Link>
                  <Link href={`/title/movie/${featured.id}`}>
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
          <ContentRow title="Trending Movies" items={trending} />
          <ContentRow title="Popular Hits" items={popular} />
          <ContentRow title="Critically Acclaimed" items={topRated} />
        </div>
      </main>
    </div>
  );
};

export default MoviesClient;