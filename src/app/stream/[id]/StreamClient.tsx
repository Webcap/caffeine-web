"use client";

import { useEffect, useState } from "react";

interface Stream {
  id: string;
  title: string;
  sport: string;
  featured?: boolean;
  thumbnailUrl: string;
  videoUrl: string;
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

export default function StreamClient({ stream, allStreams, scoreboards, showScores }: StreamClientProps) {
  const [currentScoreboards, setCurrentScoreboards] = useState(scoreboards);
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

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

            {/* Video Player */}
            <div className="glass-panel" style={{ 
              aspectRatio: "16/9", 
              width: "100%", 
              backgroundColor: "#000", 
              borderRadius: "24px", 
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <iframe 
                src={stream.videoUrl} 
                style={{ width: "100%", height: "100%", border: "none" }}
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write"
                referrerPolicy="no-referrer"
              />
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
