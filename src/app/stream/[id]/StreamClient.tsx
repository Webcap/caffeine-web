"use client";

import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";

interface Source {
  url: string;
  name: string;
  referrer?: string;
}

interface Stream {
  id: string;
  title: string;
  sport: string;
  featured?: boolean;
  thumbnailUrl: string;
  videoUrl: string;
  referrer?: string;
  sources?: Source[];
}

interface Event {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      state: string;
      detail: string;
    };
  };
  competitions: Array<{
    competitors: Array<{
      id: string;
      team: {
        name: string;
        abbreviation: string;
        logo: string;
        displayName: string;
      };
      score: string;
    }>;
  }>;
}

interface StreamClientProps {
  stream: Stream;
  allStreams: Stream[];
  scoreboards: Record<string, { events: Event[] }>;
  showScores: boolean;
}

/** HLS Proxy Helpers */
const b64Encode = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (e) {
    return "";
  }
};

const buildProxiedUrl = (baseUrl: string, targetUrl: string, referrer?: string) => {
  if (!targetUrl) return "";
  const headers = referrer ? { "Referer": referrer, "User-Agent": "Mozilla/5.0" } : { "User-Agent": "Mozilla/5.0" };
  const encodedUrl = b64Encode(targetUrl);
  const encodedHeaders = b64Encode(JSON.stringify(headers));
  
  // Hint extension for player compatibility
  const extension = targetUrl.split("?")[0].endsWith(".m3u8") ? "/video.m3u8" : "";
  return `${baseUrl}/proxy/stream${extension}?url=${encodedUrl}&headers=${encodedHeaders}`;
};

export default function StreamClient({ stream, allStreams, scoreboards, showScores }: StreamClientProps) {
  const [currentScoreboards, setCurrentScoreboards] = useState(scoreboards);
  const [activeSource, setActiveSource] = useState<Source>({ 
    url: stream.videoUrl, 
    name: "Default Source", 
    referrer: stream.referrer 
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  // Initialize HLS player
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const url = buildProxiedUrl(API_URL, activeSource.url, activeSource.referrer);

    if (!url) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          // Note: Browsers generally forbid setting the Referer header via XHR.
          // This is included as a best effort in case a proxy or specific environment allows it.
          if (activeSource.referrer) {
            // Some providers might accept it as a custom header if configured
              xhr.setRequestHeader("X-Referer", activeSource.referrer);
          }
        }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [activeSource]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/sports/scoreboard/all`);
        const data = await res.json();
        setCurrentScoreboards(data || {});
      } catch (e) {
        console.error("Failed to refresh scoreboard:", e);
      }
    };

    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  const teams = stream.title.split(/\s+(?:vs|at|VS|AT)\s+/i);
  const t1Norm = normalize(teams[0]);
  const t2Norm = normalize(teams[1]);

  let matchData: any = null;
  let t1Logo = null, t2Logo = null;
  let t1Score = "0", t2Score = "0";

  // Lookup scoreboard data for this specific stream
  Object.values(currentScoreboards).forEach(sb => {
    sb?.events?.forEach(ev => {
      const comps = ev?.competitions?.[0]?.competitors || [];
      const hasT1 = comps.some((c: any) => normalize(c.team?.name).includes(t1Norm) || t1Norm.includes(normalize(c.team?.name)));
      const hasT2 = comps.some((c: any) => normalize(c.team?.name).includes(t2Norm) || t2Norm.includes(normalize(c.team?.name)));
      
      if (hasT1 && hasT2) {
        if (!matchData || (ev.status?.type?.state === "in" && matchData.status?.type?.state !== "in")) {
          matchData = ev;
        }
      }
    });
  });

  if (matchData) {
    const comps = matchData.competitions[0].competitors;
    const c1 = comps.find((c: any) => normalize(c.team?.name).includes(t1Norm) || t1Norm.includes(normalize(c.team?.name)));
    const c2 = comps.find((c: any) => normalize(c.team?.name).includes(t2Norm) || t2Norm.includes(normalize(c.team?.name)));
    
    const isLiveOrDone = matchData.status?.type?.state === "in" || matchData.status?.type?.state === "post";
    
    t1Logo = c1?.team?.logo;
    t2Logo = c2?.team?.logo;
    
    const s1 = parseInt(c1?.score || "0");
    const s2 = parseInt(c2?.score || "0");
    
    t1Score = isLiveOrDone ? (isNaN(s1) ? "0" : Math.max(0, s1).toString()) : "0";
    t2Score = isLiveOrDone ? (isNaN(s2) ? "0" : Math.max(0, s2).toString()) : "0";
  }

  const otherGames = allStreams.filter(s => s.id !== stream.id).slice(0, 6);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060606", color: "#fff", padding: "40px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "20px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          <a href="/live" style={{ color: "var(--accent-blue)" }}>Dashboard</a> / {stream.sport} / {stream.title}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "40px" }}>
          {/* Player & Info */}
          <div>
            {/* Video Player Header */}
            {showScores && (
              <div className="glass-panel" style={{ padding: "20px 30px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {t1Logo && <img src={t1Logo} alt="" style={{ width: "32px", height: "32px" }} />}
                    <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>{teams[0]}</span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 900 }}>VS</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {t2Logo && <img src={t2Logo} alt="" style={{ width: "32px", height: "32px" }} />}
                    <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>{teams[1]}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--win-green)" }}>
                    {t1Score} - {t2Score}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>
                    {matchData?.status?.type?.detail || "LIVE"}
                  </div>
                </div>
              </div>
            )}

            {/* Video Player Container */}
            <div className="glass-panel" style={{ 
              aspectRatio: "16/9", 
              width: "100%", 
              backgroundColor: "#000", 
              borderRadius: "24px", 
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.05)",
              position: "relative"
            }}>
              <video 
                ref={videoRef}
                controls
                autoPlay
                style={{ width: "100%", height: "100%", outline: "none" }}
                poster={stream.thumbnailUrl}
              />
              
              {/* Source Selector Overlay */}
              {stream.sources && stream.sources.length > 0 && (
                <div style={{ 
                  position: "absolute", 
                  bottom: "60px", 
                  right: "20px", 
                  zIndex: 10,
                  display: "flex",
                  gap: "10px"
                }}>
                  <select 
                    value={activeSource.url}
                    onChange={(e) => {
                      const selected = stream.sources?.find(s => s.url === e.target.value);
                      if (selected) setActiveSource(selected);
                    }}
                    style={{
                      background: "rgba(0,0,0,0.8)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "5px 10px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value={stream.videoUrl}>Default Source</option>
                    {stream.sources.map((s, i) => (
                      <option key={i} value={s.url}>{s.name || `Source ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Match Details Section */}
            <div className="glass-panel" style={{ padding: "40px", marginTop: "40px" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Match Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                <div>
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "15px" }}>Team Stats</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {["Possession", "Shots", "Shots on Target", "Pass Accuracy"].map(stat => (
                      <div key={stat}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "5px" }}>
                          <span>{stat}</span>
                          <span>--</span>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                          <div style={{ width: "50%", height: "100%", background: "var(--accent-blue)", borderRadius: "2px" }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                   <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "15px" }}>Game Info</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Venue</span>
                        <span>{matchData?.venue?.fullName || "TBD"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Competition</span>
                        <span>{stream.sport}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Broadcaster</span>
                        <span>Caffeine Premium</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Related Games */}
          <aside>
             <div className="glass-panel" style={{ padding: "30px" }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "24px" }}>Recommended Live</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {otherGames.map(s => (
                    <a key={s.id} href={`/stream/${s.id}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                      <div className="glass" style={{ padding: "15px", borderRadius: "16px", cursor: "pointer", transition: "var(--transition)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                          <span>{s.sport}</span>
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>LIVE</span>
                        </div>
                        <h4 style={{ fontSize: "0.9rem" }}>{s.title}</h4>
                      </div>
                    </a>
                  ))}
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
