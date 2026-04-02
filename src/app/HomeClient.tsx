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
import Link from "next/link";
import ContentRow from "@/components/ContentRow";
import { MediaItem } from "@/components/PosterCard";
import { supabase } from "@/lib/supabase";

interface HomeClientProps {
  initialRecommendations: MediaItem[];
  featureFlags: Record<string, boolean>;
}

const HomeClient: React.FC<HomeClientProps> = ({ initialRecommendations, featureFlags }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [featured, setFeatured] = useState<MediaItem | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    if (initialRecommendations.length > 0) {
      setFeatured(initialRecommendations[0]);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, [initialRecommendations]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "movies", icon: Film, label: "Movies" },
    { id: "tv", icon: Tv, label: "TV Shows" },
    { id: "live", icon: Trophy, label: "Live", enabled: featureFlags?.web_live_sports_enabled },
    { id: "history", icon: History, label: "My History" },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
         <div style={{ 
           width: "52px", 
           height: "52px", 
           background: "linear-gradient(135deg, var(--primary) 0%, #991b1b 100%)", 
           borderRadius: "16px", 
           display: "flex", 
           alignItems: "center", 
           justifyContent: "center", 
           fontSize: "1.4rem", 
           fontWeight: 900, 
           marginBottom: "48px", 
           boxShadow: "0 8px 20px var(--primary-glow)",
           border: "1px solid rgba(255,255,255,0.2)"
         }}>
           C
         </div>

         <nav style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
           {navItems.filter(item => item.enabled !== false).map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`nav-icon ${activeTab === item.id ? "active" : ""}`}
               title={item.label}
             >
               <item.icon size={22} />
             </button>
           ))}
         </nav>

         <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "auto" }}>
           <button className="nav-icon" title="Search"><Search size={22} /></button>
           <button className="nav-icon" title="Settings"><Settings size={22} /></button>
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
                   style={{ objectFit: "cover", opacity: 0.5 }}
                   priority
                 />
                 <div className="hero-overlay-dark" />
                 <div className="hero-overlay-glass" />
                 
                 <div className="hero-content animate-fade-in">
                    <div className="flex items-center gap-4">
                       {featured.media_type === 'tv' && (
                         <div className="badge">
                           TV SERIES
                         </div>
                       )}
                       <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 800, fontSize: "14px", letterSpacing: "0.05em" }}>
                         <TrendingUp size={16} />
                         <span>RANKED #1 TODAY</span>
                       </div>
                    </div>

                    <h1 className="text-7xl font-black" style={{ marginTop: "24px", marginBottom: "24px", maxWidth: "900px" }}>
                      {featured.title}
                    </h1>

                    <p className="text-lg text-muted line-clamp-3" style={{ maxWidth: "650px", lineHeight: "1.8", color: "rgba(255,255,255,0.7)" }}>
                      {featured.overview}
                    </p>

                    <div className="flex items-center gap-6" style={{ marginTop: "48px" }}>
                       <Link href={`/title/${featured.media_type || (featured.title ? 'movie' : 'tv')}/${featured.id}`}>
                         <button className="btn-primary" style={{ padding: "18px 48px", fontSize: "1.1rem", borderRadius: "18px" }}>
                            <Play fill="currentColor" size={24} />
                            Watch Now
                         </button>
                       </Link>
                       <Link href={`/title/${featured.media_type || (featured.title ? 'movie' : 'tv')}/${featured.id}`}>
                         <button className="btn-secondary" style={{ padding: "18px 48px", fontSize: "1.1rem", borderRadius: "18px" }}>
                            <div className="flex items-center gap-2">
                               <Info size={24} />
                               Details
                            </div>
                         </button>
                       </Link>
                    </div>
                 </div>
              </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0c0c", height: "100%", width: "100%" }}>
                  <Monitor size={64} style={{ opacity: 0.1 }} />
                </div>
            )}
         </section>

         <div style={{ marginTop: "-120px", position: "relative", zIndex: 20, paddingBottom: "100px" }}>
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
        zIndex: 150, 
        height: "80px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "flex-end", 
        padding: "0 48px",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        background: scrolled ? "rgba(11, 11, 11, 0.3)" : "transparent",
        backdropFilter: scrolled ? "var(--glass-blur)" : "none",
        borderBottom: scrolled ? "1px solid var(--glass-border)" : "none"
      }}>
         <div className="flex items-center gap-6">
            <button className="nav-icon" style={{ borderRadius: "50%" }}>
               <Search size={20} />
            </button>

            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, opacity: 0.8, letterSpacing: "0.02em" }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="auth-link" 
                  style={{ fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Log Out
                </button>
              </div>
            )}

            <Link href={user ? "/download" : "/login"} style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "16px", 
              background: "linear-gradient(135deg, var(--primary), var(--accent-blue))", 
              padding: "2px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
            }}>
               <div style={{ width: "100%", height: "100%", borderRadius: "14px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <Image src="/assets/images/Default_pfp.svg" alt="Avatar" width={40} height={40} />
               </div>
            </Link>
         </div>
      </div>
    </div>
  );
};

export default HomeClient;
