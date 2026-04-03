"use client";

import React, { useState, useEffect, useRef } from "react";
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
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ContentRow from "@/components/ContentRow";
import Sidebar from "@/components/Sidebar";
import { MediaItem } from "@/lib/tmdb";
import { supabase } from "@/lib/supabase";
import { getMovieQuality } from "@/lib/scraper";

interface HomeClientProps {
  initialRecommendations: MediaItem[];
  featureFlags: Record<string, boolean>;
}

interface LiveStream {
  id: string;
  title: string;
  sport: string;
  featured?: boolean;
  is_featured?: boolean;
  poster_url?: string;
  video_url: string;
}

const HomeClient: React.FC<HomeClientProps> = ({ initialRecommendations, featureFlags }) => {
  const [scrolled, setScrolled] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<LiveStream[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [heroQualityMap, setHeroQualityMap] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  // Combine top 3 recommendations and any featured events for the slider
  const heroSlides = [
    ...initialRecommendations.slice(0, 3).map(item => ({ ...item, type: 'media' })),
    ...featuredEvents.map(event => ({ ...event, type: 'event' }))
  ];

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchContinueWatching(currentUser.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchContinueWatching(currentUser.id);
      } else {
        setContinueWatching([]);
      }
    });

    const fetchFeaturedEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('is_featured', true);
        
        if (data) {
          setFeaturedEvents(data);
        }
      } catch (err) {
        console.error("Error fetching featured events:", err);
      }
    };

    fetchFeaturedEvents();

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (heroSlides.length === 0) return;
    
    slideInterval.current = setInterval(() => {
      nextSlide();
    }, 8000);

    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchHeroQualities = async () => {
      const mediaSlides = heroSlides.filter(s => s.type === "media");
      for (const slide of mediaSlides) {
        const q = await getMovieQuality(slide.id);
        if (q && q !== "Unknown") {
          setHeroQualityMap(prev => ({ ...prev, [slide.id]: q.toUpperCase() }));
        }
      }
    };
    if (heroSlides.length > 0) fetchHeroQualities();
  }, [initialRecommendations, featuredEvents]);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background Auroras */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      <Sidebar featureFlags={featureFlags} />

      {/* Main Content Area */}
      <main className="main-content">
         
         <section className="hero-slider">
            {heroSlides.map((slide, index) => (
              <div 
                key={`${slide.type}-${slide.id}`} 
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              >
                <Image 
                  src={slide.type === 'media' 
                    ? `https://image.tmdb.org/t/p/original${(slide as MediaItem).backdrop_path}`
                    : (slide as LiveStream).poster_url || "/assets/images/placeholder.png"
                  } 
                  alt={slide.type === 'media' ? (slide as MediaItem).title : (slide as LiveStream).title}
                  fill
                  className="hero-img"
                  style={{ objectFit: "cover", opacity: slide.type === 'event' ? 0.85 : 0.5 }}
                  priority={index === 0}
                />
                
                {slide.type === 'media' ? (
                  <>
                    <div className="hero-overlay-dark" />
                    <div className="hero-overlay-glass" />
                  </>
                ) : (
                  <div className="hero-overlay-vibrant" />
                )}
                
                <div className="hero-content animate-fade-in">
                    <div className="flex items-center gap-4">
                      {slide.type === 'media' ? (
                        <>
                          {(slide as MediaItem).media_type === 'tv' && (
                            <div className="badge">
                              TV SERIES
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 800, fontSize: "14px", letterSpacing: "0.05em" }}>
                            <TrendingUp size={16} />
                            <span>RANKED #{index + 1} TODAY</span>
                          </div>
                          {heroQualityMap[slide.id] && (
                             <div className="badge" style={{ 
                               background: heroQualityMap[slide.id] === "CAM" || heroQualityMap[slide.id] === "TS" ? "rgba(234, 179, 8, 0.95)" : "rgba(255, 255, 255, 0.15)",
                               color: heroQualityMap[slide.id] === "CAM" || heroQualityMap[slide.id] === "TS" ? "#000" : "#fff",
                               fontWeight: 900
                             }}>
                               {heroQualityMap[slide.id]}
                             </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="event-badge-live">
                            <span className="pulse-red" />
                            LIVE NOW
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--accent-blue)", fontWeight: 900, letterSpacing: "0.1em", fontSize: "14px" }}>
                            <Trophy size={20} />
                            {(slide as LiveStream).sport.toUpperCase()} FEATURED MATCH
                          </div>
                        </>
                      )}
                    </div>

                    <h1 className="text-7xl font-black" style={{ marginTop: "24px", marginBottom: "24px", maxWidth: "900px" }}>
                      {slide.type === 'media' ? (slide as MediaItem).title : (slide as LiveStream).title}
                    </h1>

                    <p className="text-lg text-muted line-clamp-3" style={{ maxWidth: "650px", lineHeight: "1.8", color: "rgba(255,255,255,0.7)" }}>
                      {slide.type === 'media' ? (slide as MediaItem).overview : `Experience the excitement of ${(slide as LiveStream).sport} live on Caffeine TV. Watch ${(slide as LiveStream).title} now!`}
                    </p>

                    <div className="flex items-center gap-6" style={{ marginTop: "48px" }}>
                      {slide.type === 'media' ? (
                        <>
                          <Link href={`/title/${(slide as MediaItem).media_type || ((slide as MediaItem).title ? 'movie' : 'tv')}/${(slide as MediaItem).id}`}>
                            <button className="btn-primary" style={{ padding: "18px 48px", fontSize: "1.1rem", borderRadius: "18px" }}>
                                <Play fill="currentColor" size={24} />
                                Watch Now
                            </button>
                          </Link>
                          <Link href={`/title/${(slide as MediaItem).media_type || ((slide as MediaItem).title ? 'movie' : 'tv')}/${(slide as MediaItem).id}`}>
                            <button className="btn-secondary" style={{ padding: "18px 48px", fontSize: "1.1rem", borderRadius: "18px" }}>
                                <div className="flex items-center gap-2">
                                  <Info size={24} />
                                  Details
                                </div>
                            </button>
                          </Link>
                        </>
                      ) : (
                        <Link href={`/stream/${slide.id}`}>
                          <button className="btn-primary" style={{ padding: "18px 48px", fontSize: "1.1rem", borderRadius: "18px" }}>
                              <Play fill="currentColor" size={24} />
                              Watch Event
                          </button>
                        </Link>
                      )}
                    </div>
                </div>
              </div>
            ))}

            {/* Slider Navigation */}
            <div className="hero-nav">
                <button className="hero-arrow-btn prev" onClick={prevSlide}>
                   <ChevronLeft size={32} />
                </button>
                <button className="hero-arrow-btn next" onClick={nextSlide}>
                   <ChevronRight size={32} />
                </button>
                
                <div className="hero-indicators">
                  {heroSlides.map((_, i) => (
                    <div 
                      key={i} 
                      className={`hero-dot ${i === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(i)}
                    />
                  ))}
                </div>
            </div>
         </section>

         <div style={{ position: "relative", zIndex: 20, paddingBottom: "100px", background: "var(--bg-black)" }}>
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
