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
  Monitor,
  User,
  LogOut
} from "lucide-react";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ContentRow from "@/components/ContentRow";
import { MediaItem } from "@/lib/tmdb";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContinueWatching = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('continue_watching_history')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
           console.error("Error fetching continue watching:", error);
           return;
        }

        if (data) {
          // Deduplicate logic: only show the latest entry per unique media_id
          const deduped: any[] = [];
          const seenIds = new Set<string | number>();

          for (const item of data) {
            if (!seenIds.has(item.media_id)) {
              seenIds.add(item.media_id);
              deduped.push({
                id: item.media_id,
                title: item.title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                media_type: item.media_type,
                progress: (item.elapsed_ms || 0) / (item.duration_ms || 1),
                elapsed_ms: item.elapsed_ms,
                duration_ms: item.duration_ms,
                episode_name: item.episode_name,
                season_num: item.season_num,
                episode_num: item.episode_num
              });
            }
          }
          setContinueWatching(deduped);
        }
      } catch (err) {
        console.error("Failed to fetch continue watching:", err);
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchContinueWatching(currentUser.id);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchContinueWatching(currentUser.id);
      } else {
        setContinueWatching([]);
      }
    });

    if (initialRecommendations.length > 0) {
      setFeatured(initialRecommendations[0]);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
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
            {continueWatching.length > 0 && (
              <ContentRow 
                title="Continue Watching" 
                items={continueWatching} 
              />
            )}

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

            {/* Username removed from header per request */}

            <div className="profile-container" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ 
                  width: "44px", 
                  height: "44px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, var(--primary), var(--accent-blue))", 
                  padding: "2px",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                  border: "none",
                  display: "block"
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <Image 
                    src={(() => {
                      const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar;
                      if (!avatar) return "/assets/images/Default_pfp.svg";
                      if (avatar.startsWith("http")) return avatar;
                      if (avatar.includes("/")) return avatar;
                      // Fallback for ID-based profile pics in assets/images/profiles
                      return `/assets/images/profiles/${avatar}${avatar.includes(".") ? "" : ".png"}`;
                    })()} 
                    alt="Avatar" 
                    width={40} 
                    height={40} 
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/images/Default_pfp.svg";
                    }}
                  />
                </div>
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  {user ? (
                    <>
                      <div className="dropdown-header">
                        <div className="dropdown-name">@{user.user_metadata?.username || user.email?.split('@')[0]}</div>
                        <div className="dropdown-email">{user.email}</div>
                      </div>
                      
                      <button className="dropdown-item">
                        <User size={18} />
                        View Profile
                      </button>
                      <button className="dropdown-item">
                        <Settings size={18} />
                        Account Settings
                      </button>
                      <div style={{ height: "1px", background: "var(--glass-border)", margin: "8px 0" }} />
                      <button 
                        onClick={handleLogout} 
                        className="dropdown-item danger"
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="dropdown-header">
                        <div className="dropdown-name">Welcome to Caffeine</div>
                        <div className="dropdown-email">Sign in to sync your progress</div>
                      </div>
                      <Link href="/login" style={{ width: "100%" }}>
                        <button className="dropdown-item">
                          <LogOut size={18} style={{ transform: "rotate(180deg)" }} />
                          Sign In
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default HomeClient;
