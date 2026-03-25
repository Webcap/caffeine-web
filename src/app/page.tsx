"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Fetch APK URL from API
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";
        const response = await fetch(`${apiUrl}/config`);
        const data = await response.json();
        setVersion(data.latest_version || null);
        const url = data.update_download_url || data.update_store_url;
        if (url && url !== "") {
          setApkUrl(url);
        }
      } catch (e) {
        console.error("Failed to fetch APK config:", e);
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
          <a href="#features" style={{ fontSize: "0.9rem", opacity: 0.8 }}>Features</a>
          <a href="#download" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>Download</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: "160px 4rem 100px", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Abstract background glow */}
        <div style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)",
          zIndex: -1,
          filter: "blur(80px)"
        }} />

        <div className="animate-fade-in">
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
            <button className="btn-secondary">View Offerings</button>
          </div>
        </div>

        {/* Mockup Placeholder */}
        <div className="animate-fade-in" style={{ 
          marginTop: "80px",
          width: "100%",
          maxWidth: "1000px",
          position: "relative",
          animationDelay: "0.2s"
        }}>
          <div className="glass" style={{
            borderRadius: "24px 24px 0 0",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.02)",
            borderBottom: "none"
          }}>
             <div style={{ 
               width: "100%", 
               height: "500px", 
               background: "#161616", 
               borderRadius: "12px",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               overflow: "hidden",
               position: "relative"
             }}>
                <Image 
                  src="/hero-mockup.png" 
                  alt="Caffeine App Mockup" 
                  fill 
                  style={{ objectFit: "cover", opacity: 0.8 }}
                />
                <div style={{ zIndex: 1, textAlign: "center", padding: "40px" }}>
                   <div style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "10px" }}>CAFFEINE</div>
                   <div style={{ color: "var(--text-muted)" }}>Premium Interface Demonstration</div>
                </div>
             </div>
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
                   <span className="badge">v{version}</span>
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
                    {loading ? "Discovering..." : (apkUrl ? "Download APK" : "Ready for Deployment")}
                  </a>
                  {!apkUrl && !loading && (
                    <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 500 }}>
                       Configure link in Admin Panel
                    </div>
                  )}
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
               <button className="btn-secondary" style={{ width: "100%" }} onClick={() => alert("Deployment in progress. Check Back Soon.")}>
                 Coming SOON
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
              { title: "4K HDR Streaming", desc: "Crystal clear quality with ultra-low latency.", icon: "⚡" },
              { title: "Universal Sync", desc: "Start on your TV, finish on your phone.", icon: "🔄" },
              { title: "Live Sports", desc: "Never miss a moment with real-time broadcasts.", icon: "⚽" }
            ].map((feature, i) => (
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
        <p>&copy; 2026 Webcap Media. All rights reserved.</p>
      </footer>
    </main>
  );
}
