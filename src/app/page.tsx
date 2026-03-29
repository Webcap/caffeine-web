"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { mixpanelInit, trackEvent } from "@/lib/mixpanel";
import VersionDisplay from "@/components/VersionDisplay";


export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [tvApkUrl, setTvApkUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Record<string, boolean>>({
    enable_ott: false,
    web_live_sports: false
  });
  const [featuredUfc, setFeaturedUfc] = useState<any>(null);

  // Local posters from /public/assets/posters
  const localPosters = [
    "1_Peaky Blinders The Immortal Man.jpg", "2_Project Hail Mary.jpg", "3_How to Make a Killing.jpg",
    "4_Agent Zeta.jpg", "5_Send Help.jpg", "6_They Will Kill You.jpg", "7_War Machine.jpg",
    "8_Greenland 2 Migration.jpg", "9_GOAT.jpg", "10_Scream 7.jpg", "11_Avatar Fire and Ash.jpg",
    "12_Zootopia 2.jpg", "13_Marty Supreme.jpg", "14_Hoppers.jpg", "15_Dhurandhar The Revenge.jpg",
    "16_The Drama.jpg", "17_Spider-Man Brand New Day.jpg", "18_Ready or Not Here I Come.jpg",
    "19_Scary Movie.jpg", "20_One Battle After Another.jpg"
  ].map(name => `/assets/posters/${name}`);

  const marqueePosters = [...localPosters, ...localPosters]; // For seamless scroll

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Fetch APK URL from API and Feature Flags
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";
        
        // Fetch config, updates, and flags in parallel
        const env = process.env.NODE_ENV === "development" ? "development" : "production";
        
        const fetchUpdate = async (platform: string) => {
          const res = await fetch(`${apiUrl}/v1/updates?platform=${platform}&environment=${env}`, { cache: "no-store" });
          if (res.ok) return await res.json();
          
          // Environment fallback: If dev, try prod
          if (env === "development") {
             console.log(`[Updates] ${platform} not found in development, falling back to production...`);
             const fallbackRes = await fetch(`${apiUrl}/v1/updates?platform=${platform}&environment=production`, { cache: "no-store" });
             if (fallbackRes.ok) return await fallbackRes.json();
          }
          return null;
        };

        const [configRes, androidUpdate, tvUpdate, flagsRes, ufcRes] = await Promise.all([
          fetch(`${apiUrl}/config`, { cache: "no-store" }),
          fetchUpdate("android"),
          fetchUpdate("tv"),
          fetch(`${apiUrl}/v1/feature-flags?platform=web&env=${env}`, { cache: "no-store" }),
          fetch(`${apiUrl}/v1/summary?sport=mma&league=ufc`, { cache: "no-store" })
        ]);
 
        const configData = await configRes.json();
        const featureFlags = flagsRes.ok ? await flagsRes.json() : {};
        const ufcData = ufcRes.ok ? await ufcRes.json() : null;

        console.log(`[Flags] Raw API Response (${env}):`, featureFlags);
        console.log(`[Updates] Android:`, androidUpdate);
        console.log(`[Updates] TV:`, tvUpdate);

        // Parse UFC Data for Featured Banner
        if (ufcData && ufcData.events && ufcData.events.length > 0) {
            const event = ufcData.events[0];
            const comps = event.competitions || [];
            if (comps.length > 0) {
                // Find active or main (last)
                const active = comps.find((c: any) => c.status?.type?.state === 'in');
                const next = comps.find((c: any) => c.status?.type?.state === 'pre');
                const main = comps[comps.length - 1];
                const target = active || next || main;
                
                if (target) {
                   const competitors = target.competitors || [];
                   const athlete1 = competitors[0]?.athlete;
                   const athlete2 = competitors[1]?.athlete;
                   
                   setFeaturedUfc({
                      id: event.id,
                      name: event.shortName || event.name,
                      status: target.status?.type?.shortDetail || target.status?.type?.description,
                      isLive: target.status?.type?.state === 'in',
                      fighter1: athlete1?.shortName || athlete1?.displayName || "TBD",
                      fighter2: athlete2?.shortName || athlete2?.displayName || "TBD",
                      logo: "https://upload.wikimedia.org/wikipedia/commons/d/d7/UFC_Logo.png"
                   });
                }
            }
        }

        // Set version and download links strictly from new updates system
        if (androidUpdate) {
          setVersion(androidUpdate.latest_version);
          setApkUrl(androidUpdate.download_url || androidUpdate.store_url || null);
        } else {
          setVersion(null);
          setApkUrl(null);
        }

        if (tvUpdate) {
          setTvApkUrl(tvUpdate.download_url || tvUpdate.store_url || null);
        } else {
          setTvApkUrl(null);
        }

        // Set Feature Flags with priority to the new system, then legacy config
        const getFlag = (key: string, legacyValue: any, defaultValue: boolean, isMigrated: boolean = false) => {
           // 1. New System Priority
           if (featureFlags && featureFlags[key] !== undefined) {
             const val = featureFlags[key] === true;
             console.log(`[Flags] ${key} from new system: ${val}`);
             return val;
           }
           
           // 2. If it's a migrated flag, and we are using the new system (even if empty/no-config for this env), 
           // we default it to false to avoid legacy leakage.
           if (isMigrated) {
             console.log(`[Flags] ${key} is migrated but missing from new system API, forcing false.`);
             return false;
           }

           // 3. Fallback to default
           return legacyValue ?? defaultValue;
        };

        const newFlags = {
          enable_ott: getFlag("enable_ott", configData.enable_ott, false, true), // isMigrated: true
          web_live_sports: getFlag("web_live_sports", configData.web_live_sports, false, true) // isMigrated: true
        };

        console.log("[Flags] Final evaluated flags:", newFlags);
        setFlags(newFlags);

        // Initialize Mixpanel
        if (configData.mixpanel_token) {
          mixpanelInit(configData.mixpanel_token);
          trackEvent("Web App Started");
        }
      } catch (e) {
        console.error("Failed to fetch config:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">
          CAFFEINE <span className="logo-badge">TV</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "2rem", alignItems: "center" }}>
          {flags.enable_ott && (
             <a href="/live" style={{ fontSize: "0.9rem", opacity: 0.8, color: "var(--accent-blue)", fontWeight: 700 }}>Live</a>
          )}
          <a href="#features" style={{ fontSize: "0.9rem", opacity: 0.8 }}>Features</a>
          <a href="#download" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>Download</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: "160px 4rem 140px", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#060606"
      }}>
        {/* Poster Marquee Background */}
        <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.15,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "40px 0",
            transform: "rotate(-2deg) scale(1.1)",
          }}>
            <div className="marquee-content marquee-left">
              {marqueePosters.map((url, i) => (
                <div key={`left-${i}`} className="poster-card">
                  <img src={url} alt="Poster" className="poster-img" loading="lazy" />
                </div>
              ))}
            </div>
            <div className="marquee-content marquee-right">
              {marqueePosters.slice().reverse().map((url, i) => (
                <div key={`right-${i}`} className="poster-card">
                  <img src={url} alt="Poster" className="poster-img" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

        {/* Gradient Mask Overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          background: `
            radial-gradient(circle at center, transparent 0%, var(--background) 80%),
            linear-gradient(to bottom, var(--background) 0%, transparent 20%, transparent 80%, var(--background) 100%)
          `,
          pointerEvents: "none"
        }} />

        {/* Featured UFC Banner */}
        {flags.web_live_sports && featuredUfc && (
          <div className="animate-fade-in" style={{ 
            position: "relative", 
            zIndex: 10, 
            marginBottom: "3rem",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            padding: "16px 24px",
            borderRadius: "100px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}>
            <img src={featuredUfc.logo} alt="UFC" style={{ height: "18px", opacity: 0.8 }} />
            <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>FEATURED EVENT</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{featuredUfc.name}</span>
            </div>
            <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-blue)" }}>{featuredUfc.fighter1} vs {featuredUfc.fighter2}</span>
              </div>
              <div style={{ 
                padding: "4px 10px", 
                background: featuredUfc.isLive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)", 
                borderRadius: "6px",
                border: featuredUfc.isLive ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                {featuredUfc.isLive && (
                   <div style={{ width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%" }} className="glow-pulse" />
                )}
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: featuredUfc.isLive ? "#ef4444" : "#888", textTransform: "uppercase" }}>
                  {featuredUfc.status}
                </span>
              </div>
            </div>
            {flags.enable_ott && (
               <>
                <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }} />
                <a href="/live" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.75rem", borderRadius: "80px" }}>Watch Now</a>
               </>
            )}
          </div>
        )}

        <div className="animate-fade-in" style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{ fontSize: "clamp(3rem, 8vw, 5rem)", marginBottom: "1.5rem" }}>
            Stream <span className="gradient-text">Everything</span>.<br />
            Anywhere.
          </h1>
          <p style={{ 
            fontSize: "1.25rem", 
            color: "var(--text-muted)", 
            maxWidth: "600px", 
            margin: "0 auto 2.5rem",
            lineHeight: 1.6
          }}>
            Experience the next generation of cinematic streaming. High-definition movies, trending shows, and live sports at your fingertips.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <a href="#download" className="btn-primary glow-pulse">Get Started Now</a>
          </div>
        </div>

      </section>

      {/* Download Section */}
      <section id="download" style={{ padding: "100px 4rem", position: "relative", overflow: "hidden" }}>
         <div style={{
          position: "absolute",
          top: "50%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(96, 165, 250, 0.05) 0%, transparent 70%)",
          zIndex: -1,
          filter: "blur(60px)"
        }} />

         <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Take Caffeine with You</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto" }}>
               Download the Android app directly from our servers or use the cross-platform TV client.
            </p>
         </div>

         <div style={{ 
           display: "grid", 
           gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
           gap: "2.5rem",
           maxWidth: "1200px",
           margin: "0 auto"
         }}>
            {/* Android Mobile */}
            <div className="glass animate-fade-in" style={{ padding: "40px", borderRadius: "24px", textAlign: "center", position: "relative" }}>
               {version && (
                 <div style={{ position: "absolute", top: "20px", right: "20px" }}>
                   <VersionDisplay version={version} />
                 </div>
               )}

               <div style={{ 
                 fontSize: "3rem", 
                 marginBottom: "20px",
                 width: "80px",
                 height: "80px",
                 margin: "0 auto 20px",
                 background: "linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.02))",
                 borderRadius: "20px",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center"
               }}>📱</div>
               <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Caffeine for Android</h3>
               <p style={{ color: "var(--text-muted)", marginBottom: "30px", minHeight: "3rem" }}>
                  The full cinematic experience in the palm of your hand. Optimized for battery life and data.
               </p>
               
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <a 
                    href={apkUrl || "#"} 
                    className={`btn-primary ${!apkUrl && "disabled"}`} 
                    style={{ 
                      width: "100%", 
                      justifyContent: "center",
                      opacity: apkUrl ? 1 : 0.5,
                      cursor: apkUrl ? "pointer" : "not-allowed"
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {loading ? "Discovering..." : (apkUrl ? "Download APK" : "Download link coming soon")}
                  </a>
               </div>

               <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--glass-border)", fontSize: "0.8rem", color: "#666", display: "flex", justifyContent: "center", gap: "1rem" }}>
                  <span>Direct Download</span>
                  <span>•</span>
                  <span>Android 8.0+</span>
               </div>
            </div>

            {/* Android TV */}
            <div className="glass animate-fade-in" style={{ padding: "40px", borderRadius: "24px", textAlign: "center", animationDelay: "0.1s" }}>
               <div style={{ 
                 fontSize: "3rem", 
                 marginBottom: "20px",
                 width: "80px",
                 height: "80px",
                 margin: "0 auto 20px",
                 background: "linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(96, 165, 250, 0.02))",
                 borderRadius: "20px",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center"
               }}>📺</div>
               <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Android TV / Box</h3>
               <p style={{ color: "var(--text-muted)", marginBottom: "30px", minHeight: "3rem" }}>
                  Bringing the big screen home. Native TV interface with remote control optimization.
               </p>
               <button 
                 className={`btn-secondary ${!tvApkUrl && "disabled"}`} 
                 style={{ width: "100%", opacity: tvApkUrl ? 1 : 0.5, cursor: tvApkUrl ? "pointer" : "not-allowed" }} 
                 onClick={() => {
                   if (tvApkUrl) window.open(tvApkUrl, "_blank");
                   else alert("Deployment in progress. Check Back Soon.");
                 }}
               >
                 {loading ? "Discovering..." : (tvApkUrl ? "Download TV APK" : "Coming SOON")}
               </button>
               <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--glass-border)", fontSize: "0.8rem", color: "#666", display: "flex", justifyContent: "center", gap: "1rem" }}>
                  <span>Sideload ready</span>
                  <span>•</span>
                  <span>4K Support</span>
               </div>
            </div>
         </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: "100px 4rem", background: "#080808" }}>
         <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Engineered for Perfection</h2>
            <p style={{ color: "var(--text-muted)" }}>Every feature designed to elevate your viewing experience.</p>
         </div>
         
         <div style={{ 
           display: "grid", 
           gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
           gap: "2rem" 
         }}>
            {[
              { title: "4K HDR Streaming", desc: "Crystal clear quality with ultra-low latency.", icon: "⚡", enabled: true },
              { title: "Universal Sync", desc: "Start on your TV, finish on your phone.", icon: "🔄", enabled: true },
              { title: "Live Sports", desc: "Never miss a moment with real-time broadcasts.", icon: "⚽", enabled: flags.web_live_sports }
            ].filter(f => f.enabled).map((feature, i) => (
              <div key={i} className="glass" style={{ padding: "40px", borderRadius: "16px", transition: "var(--transition)" }}>
                 <div style={{ fontSize: "2rem", marginBottom: "20px" }}>{feature.icon}</div>
                 <h3 style={{ marginBottom: "12px" }}>{feature.title}</h3>
                 <p style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{feature.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: "60px 4rem", 
        borderTop: "1px solid var(--glass-border)",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.9rem"
      }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: "20px", color: "#fff", opacity: 0.5 }}>
          CAFFEINE <span className="logo-badge" style={{ filter: "grayscale(1)" }}>TV</span>
        </div>
        <div style={{ marginBottom: "12px", letterSpacing: "0.05em", fontWeight: 600, fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
          ALL MEDIA IS NOT HOSTED ON CAFFEINE SERVERS
        </div>
        <p>&copy; 2026 Webcap Media Group. All rights reserved.</p>
      </footer>
    </main>
  );
}
