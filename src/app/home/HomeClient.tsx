"use client";
 
import React, { useState, useEffect } from "react";
import { 
  Home, 
  Film, 
  Tv, 
  Search, 
  Settings, 
  Play, 
  Info,
  Trophy,
  History,
  TrendingUp,
  Monitor
} from "lucide-react";
import Image from "next/image";
import ContentRow from "@/components/ContentRow";
import { MediaItem } from "@/components/PosterCard";
 
interface HomeClientProps {
  initialRecommendations: MediaItem[];
  featureFlags: Record<string, boolean>;
}
 
const HomeClient: React.FC<HomeClientProps> = ({ initialRecommendations, featureFlags }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [featured, setFeatured] = useState<MediaItem | null>(null);
 
  useEffect(() => {
    if (initialRecommendations.length > 0) {
      setFeatured(initialRecommendations[0]);
    }
 
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [initialRecommendations]);
 
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "movies", icon: Film, label: "Movies" },
    { id: "tv", icon: Tv, label: "TV Shows" },
    { id: "live", icon: Trophy, label: "Live", enabled: featureFlags?.web_live_sports_enabled },
    { id: "history", icon: History, label: "My History" },
  ];
 
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
         <div style={{ 
           width: "48px", 
           height: "48px", 
           background: "var(--primary)", 
           borderRadius: "14px", 
           display: "flex", 
           alignItems: "center", 
           justifyContent: "center", 
           fontSize: "1.2rem", 
           fontWeight: 900, 
           marginBottom: "40px", 
           boxShadow: "0 0 20px var(--primary-glow)" 
         }}>
           C
         </div>
 
         <nav style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
           {navItems.filter(item => item.enabled !== false).map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`nav-icon ${activeTab === item.id ? "active" : ""}`}
             >
               <item.icon size={22} />
             </button>
           ))}
         </nav>
 
         <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "auto" }}>
           <button className="nav-icon"><Search size={22} /></button>
           <button className="nav-icon"><Settings size={22} /></button>
         </div>
      </aside>
 
      {/* Main Content Area */}
      <main className="main-content">
         
         <section className="hero">
            {featured ? (
              <>
                 <Image 
                   src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`} 
                   alt={featured.title}
                   fill
                   className="hero-img"
                   style={{ objectFit: "cover", opacity: 0.6 }}
                   priority
                 />
                 <div className="hero-overlay-dark" />
                 
                 <div className="hero-content animate-fade-in">
                    <div className="flex items-center gap-3">
                       {featured.media_type === 'tv' && (
                         <div style={{ 
                           padding: "4px 12px", 
                           background: "rgba(255,255,255,0.1)", 
                           borderRadius: "6px", 
                           fontSize: "10px", 
                           fontWeight: 900, 
                           textTransform: "uppercase", 
                           letterSpacing: "0.1em",
                           border: "1px solid var(--glass-border)",
                           backdropFilter: "blur(12px)"
                         }}>
                           Series
                         </div>
                       )}
                       <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 700, fontSize: "14px" }}>
                         <span>Trending Now</span>
                         <TrendingUp size={16} />
                       </div>
                    </div>
 
                    <h1 className="text-7xl font-black" style={{ marginTop: "16px", marginBottom: "24px" }}>
                      {featured.title}
                    </h1>
 
                    <p className="text-lg text-muted line-clamp-3" style={{ maxWidth: "600px", lineHeight: "1.6" }}>
                      {featured.overview}
                    </p>
 
                    <div className="flex items-center gap-4" style={{ marginTop: "40px" }}>
                       <button className="btn-primary" style={{ padding: "16px 40px", fontSize: "1.1rem", borderRadius: "16px" }}>
                          <Play fill="currentColor" size={24} />
                          Watch Now
                       </button>
                       <button className="btn-secondary" style={{ padding: "16px 40px", fontSize: "1.1rem", borderRadius: "16px" }}>
                          <Info size={24} />
                          More Info
                       </button>
                    </div>
                 </div>
              </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0c0c", height: "100%", width: "100%" }}>
                  <Monitor size={64} style={{ opacity: 0.1 }} />
                </div>
            )}
         </section>
 
         <div style={{ marginTop: "-80px", position: "relative", zIndex: 20, paddingBottom: "80px" }}>
            <ContentRow 
              title="Recommended For You" 
              items={initialRecommendations.slice(0, 10)} 
            />
            
            <ContentRow 
              title="Trending Movies" 
              items={initialRecommendations.filter(r => r.media_type === 'movie').slice(0, 10)} 
            />
 
            <ContentRow 
              title="Popular TV Shows" 
              items={initialRecommendations.filter(r => r.media_type === 'tv').slice(0, 10)} 
            />
         </div>
      </main>
 
      {/* Scroll Trigger Header */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: "96px", 
        right: 0, 
        zIndex: 40, 
        height: "80px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "flex-end", 
        padding: "0 48px",
        transition: "all 0.3s ease",
        background: scrolled ? "rgba(11,11,11,0.6)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--glass-border)" : "none"
      }}>
         <div style={{ 
           width: "40px", 
           height: "40px", 
           borderRadius: "50%", 
           background: "linear-gradient(to bottom right, var(--primary), var(--accent-blue))", 
           padding: "2px",
           cursor: "pointer"
         }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1a1a1a" }} />
         </div>
      </div>
    </div>
  );
};
 
export default HomeClient;
