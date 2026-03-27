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

interface LiveClientProps {
  initialStreams: Stream[];
  initialScoreboards: Record<string, { events: Event[] }>;
}

export default function LiveClient({ initialStreams, initialScoreboards }: LiveClientProps) {
  const [streams, setStreams] = useState<Stream[]>(initialStreams);
  const [scoreboards, setScoreboards] = useState<Record<string, { events: Event[] }>>(initialScoreboards);
  const [selectedSport, setSelectedSport] = useState("All");
  const [loading, setLoading] = useState(false); // No longer strictly "loading" since we have initial data

  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamsRes, scoreboardsRes] = await Promise.all([
          fetch(`${API_URL}/sports/streams`),
          fetch(`${API_URL}/sports/scoreboard/all`)
        ]);

        const streamsData = await streamsRes.json();
        const scoreboardsData = await scoreboardsRes.json();

        setStreams(Array.isArray(streamsData) ? streamsData : []);
        setScoreboards(scoreboardsData || {});
      } catch (e) {
        console.error("Failed to fetch sports data:", e);
      }
    };

    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [API_URL]);
  
  // Date formatting helper
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const sports = ["All", "NBA", "NFL", "MLB", "NHL", "Soccer"];
  const dates = [
    { day: "Mon", date: "21 Jan" },
    { day: "Tue", date: "22 Jan" },
    { day: "Wed", date: "23 Jan" },
    { day: "Thu", date: "24 Jan", active: true },
    { day: "Fri", date: "25 Jan" },
    { day: "Sat", date: "26 Jan" },
    { day: "Sun", date: "27 Jan" },
  ];

  const filteredStreams = selectedSport === "All" 
    ? streams 
    : streams.filter(s => s.sport.toUpperCase() === selectedSport.toUpperCase());

  const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";

  // Helper to get effective timestamp for sorting
  const getEffectiveTimestamp = (stream: Stream) => {
    // Check if we have scoreboard data for this stream
    const teams = stream.title.split(/\s+(?:vs|at|VS|AT)\s+/i);
    const t1Norm = normalize(teams[0]);
    const t2Norm = normalize(teams[1]);

    let bestTs = (stream as any).timestamp ? (stream as any).timestamp * 1000 : 0;
    
    // Check scoreboards for a matching event
    Object.values(scoreboards).forEach(sb => {
      sb?.events?.forEach(ev => {
        const comps = ev?.competitions?.[0]?.competitors || [];
        const hasT1 = comps.some((c: any) => normalize(c.team?.name).includes(t1Norm) || t1Norm.includes(normalize(c.team?.name)));
        const hasT2 = comps.some((c: any) => normalize(c.team?.name).includes(t2Norm) || t2Norm.includes(normalize(c.team?.name)));
        
        if (hasT1 && hasT2) {
          const dateTs = new Date(ev.date).getTime();
          if (dateTs > 0) bestTs = dateTs;
        }
      });
    });
    return bestTs;
  };

  // Sort streams by start time
  const sortedStreams = [...filteredStreams].sort((a, b) => getEffectiveTimestamp(a) - getEffectiveTimestamp(b));

  const featuredStream = streams.find(s => s.featured);

  // Extract completed games from scoreboards
  const completedGames = Object.values(scoreboards).flatMap(sb => 
    sb?.events?.filter(ev => ev.status?.type?.state === "post") || []
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#060606", 
      color: "#fff",
      display: "flex"
    }}>
      {/* Vertical Sidebar */}
      <aside style={{ 
        width: "100px", 
        height: "100vh", 
        position: "fixed", 
        left: 0, 
        top: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 0",
        borderRight: "1px solid var(--glass-border)",
        background: "rgba(255,255,255,0.01)",
        zIndex: 100
      }}>
        <div className="sidebar-icon active" style={{ marginBottom: "40px" }}>
          <span style={{ fontSize: "1.2rem" }}>📊</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {["📅", "🏆", "📈", "⚙️"].map((icon, i) => (
            <div key={i} className="sidebar-icon">{icon}</div>
          ))}
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="sidebar-icon">👤</div>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ 
        marginLeft: "100px", 
        flex: 1, 
        padding: "40px 60px"
      }}>
        {/* Top Header */}
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "40px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
             <div className="logo" style={{ fontSize: "1.8rem" }}>
                Caffeine Live
             </div>
          </div>
          
          <div className="glass" style={{ padding: "6px", borderRadius: "14px", display: "flex", gap: "4px" }}>
            {sports.map(sport => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={selectedSport === sport ? "nav-link-active" : ""}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  transition: "var(--transition)",
                  background: selectedSport === sport ? "var(--accent-blue)" : "transparent",
                  color: selectedSport === sport ? "#fff" : "var(--text-muted)"
                }}
              >
                {sport}
              </button>
            ))}
          </div>
        </header>

        {/* Date Selector */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "40px",
          marginBottom: "50px",
          padding: "20px",
          borderBottom: "1px solid var(--glass-border)"
        }}>
          {dates.map((d, i) => (
            <div key={i} style={{ 
              textAlign: "center", 
              cursor: "pointer",
              opacity: d.active ? 1 : 0.4,
              borderBottom: d.active ? "2px solid var(--accent-blue)" : "none",
              paddingBottom: "10px",
              transition: "var(--transition)"
            }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "4px", fontWeight: 700 }}>{d.day}</div>
              <div style={{ fontSize: "1rem", fontWeight: 800 }}>{d.date}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "40px" }}>
          {/* Main Area */}
          <div>
            {/* Featured Section */}
            {featuredStream && (
              <section style={{ marginBottom: "50px" }}>
                 <div className="glass-panel" style={{ 
                   padding: "60px", 
                   textAlign: "center",
                   position: "relative",
                   backgroundImage: "radial-gradient(circle at 50% -20%, rgba(59, 130, 246, 0.1), transparent 60%)"
                 }}>
                    <div style={{ position: "absolute", top: "30px", left: "30px" }}>
                      <span className="glass" style={{ padding: "6px 12px", borderRadius: "8px", color: "#ef4444", fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="pulse-live"></span> LIVE
                      </span>
                    </div>
                    
                    {(() => {
                      const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
                      const t1Norm = normalize(featuredStream.title.split(/\s+(?:vs|at|VS|AT)\s+/i)[0]);
                      const t2Norm = normalize(featuredStream.title.split(/\s+(?:vs|at|VS|AT)\s+/i)[1]);
                      const t1Name = featuredStream.title.split(/\s+(?:vs|at|VS|AT)\s+/i)[0]?.trim();
                      const t2Name = featuredStream.title.split(/\s+(?:vs|at|VS|AT)\s+/i)[1]?.trim();
                      
                      let bestEvent: any = null;
                      let t1Logo = null, t2Logo = null;
                      let t1Score = null, t2Score = null;

                      if (scoreboards) {
                        Object.values(scoreboards).forEach(sb => {
                          sb?.events?.forEach(ev => {
                            const competitors = ev?.competitions?.[0]?.competitors || [];
                            const hasT1 = competitors.some((c: any) => {
                              const cn = normalize(c.team?.name);
                              const cfn = normalize(c.team?.displayName);
                              const csn = normalize(c.team?.shortDisplayName);
                              return cn.includes(t1Norm) || t1Norm.includes(cn) || cfn.includes(t1Norm) || t1Norm.includes(cfn) || csn.includes(t1Norm) || t1Norm.includes(csn);
                            });
                            const hasT2 = competitors.some((c: any) => {
                              const cn = normalize(c.team?.name);
                              const cfn = normalize(c.team?.displayName);
                              const csn = normalize(c.team?.shortDisplayName);
                              return cn.includes(t2Norm) || t2Norm.includes(cn) || cfn.includes(t2Norm) || t2Norm.includes(cfn) || csn.includes(t2Norm) || t2Norm.includes(csn);
                            });

                            if (hasT1 && hasT2) {
                              if (!bestEvent || (ev.status?.type?.state === "in" && bestEvent.status?.type?.state !== "in")) {
                                bestEvent = ev;
                              }
                            }
                          });
                        });

                        if (bestEvent) {
                          const comps = bestEvent.competitions?.[0]?.competitors || [];
                          const c1 = comps.find((c: any) => {
                             const cn = normalize(c.team?.name);
                             const cfn = normalize(c.team?.displayName);
                             return cn.includes(t1Norm) || t1Norm.includes(cn) || cfn.includes(t1Norm) || t1Norm.includes(cfn);
                          });
                          const c2 = comps.find((c: any) => {
                             const cn = normalize(c.team?.name);
                             const cfn = normalize(c.team?.displayName);
                             return cn.includes(t2Norm) || t2Norm.includes(cn) || cfn.includes(t2Norm) || t2Norm.includes(cfn);
                          });
                          
                          const isLiveOrDone = bestEvent.status?.type?.state === "in" || bestEvent.status?.type?.state === "post";
                          
                          if (c1) { 
                            t1Logo = c1.team?.logo; 
                            const s = parseInt(c1.score);
                            t1Score = isLiveOrDone ? (isNaN(s) ? "0" : Math.max(0, s).toString()) : "0"; 
                          }
                          if (c2) { 
                            t2Logo = c2.team?.logo; 
                            const s = parseInt(c2.score);
                            t2Score = isLiveOrDone ? (isNaN(s) ? "0" : Math.max(0, s).toString()) : "0"; 
                          }
                        }
                      }

                      return (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "60px", marginBottom: "30px" }}>
                          <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "1rem", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" }}>{featuredStream.sport}</div>
                            {t1Logo && <img src={t1Logo} alt="" style={{ width: "80px", height: "80px", marginBottom: "15px", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.2))" }} />}
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t1Name}</h3>
                            {t1Score !== null && <div style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "10px" }}>{t1Score}</div>}
                          </div>
                          
                          <div style={{ textAlign: "center", minWidth: "150px" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-muted)", marginBottom: "5px" }}>VS</div>
                            {bestEvent && (
                              <div className="glass" style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                                {bestEvent.status.type.state === "pre" ? `Starts ${formatTime(bestEvent.date)}` : bestEvent.status.type.detail}
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "1rem", color: "transparent", userSelect: "none", marginBottom: "10px" }}>.</div>
                            {t2Logo && <img src={t2Logo} alt="" style={{ width: "80px", height: "80px", marginBottom: "15px", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.2))" }} />}
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t2Name}</h3>
                            {t2Score !== null && <div style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "10px" }}>{t2Score}</div>}
                          </div>
                        </div>
                      );
                    })()}

                    <a href={`/stream/${featuredStream.id}`} className="btn-primary glow-pulse" style={{ 
                      background: "var(--accent-blue)", 
                      borderRadius: "12px", 
                      padding: "14px 32px",
                      textDecoration: "none",
                      color: "white",
                      fontWeight: 700,
                      display: "inline-block"
                    }}>
                      Watch Stream
                    </a>
                 </div>
              </section>
            )}

            {/* Tables Area */}
            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "24px" }}>{selectedSport === "All" ? "Live Now" : `${selectedSport} Live Games`}</h2>
              <div className="glass-panel" style={{ padding: "30px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <th style={{ padding: "12px" }}>TIME</th>
                      <th style={{ padding: "12px" }}>SPORT</th>
                      <th style={{ padding: "12px" }}>MATCHUP</th>
                      <th style={{ padding: "12px" }}>SCORE</th>
                      <th style={{ padding: "12px" }}>STATUS</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStreams.length > 0 ? (
                      sortedStreams.map((stream, i) => {
                        const teams = stream.title.split(/\s+(?:vs|at|VS|AT)\s+/i);
                        const t1Norm = normalize(teams[0]);
                        const t2Norm = normalize(teams[1]);
                        
                        let matchData: any = null;
                        let t1Logo = null, t2Logo = null;
                        let t1Score = "0", t2Score = "0";


                        // Lookup scoreboard data for this specific stream
                        Object.values(scoreboards).forEach(sb => {
                          sb?.events?.forEach(ev => {
                            const comps = ev?.competitions?.[0]?.competitors || [];
                            const hasMatch = (norm: string) => comps.some((c: any) => {
                              const cn = normalize(c.team?.name);
                              const cfn = normalize(c.team?.displayName);
                              const csn = normalize(c.team?.shortDisplayName);
                              return cn.includes(norm) || norm.includes(cn) || cfn.includes(norm) || norm.includes(cfn) || csn.includes(norm) || norm.includes(csn);
                            });

                            if (hasMatch(t1Norm) && hasMatch(t2Norm)) {
                              if (!matchData || (ev.status?.type?.state === "in" && matchData.status?.type?.state !== "in")) {
                                matchData = ev;
                              }
                            }
                          });
                        });

                        if (matchData) {
                          // Filter out completed matches from the live table
                          if ((matchData as any).status?.type?.state === "post") {
                            return null;
                          }

                          const comps = (matchData as any).competitions[0].competitors;
                          const hasMatch = (norm: string) => comps.find((c: any) => {
                             const cn = normalize(c.team?.name);
                             const cfn = normalize(c.team?.displayName);
                             const csn = normalize(c.team?.shortDisplayName);
                             return cn.includes(norm) || norm.includes(cn) || cfn.includes(norm) || norm.includes(cfn) || csn.includes(norm) || norm.includes(csn);
                          });

                          const c1 = hasMatch(t1Norm);
                          const c2 = hasMatch(t2Norm);
                          
                          const isLiveOrDone = (matchData as any).status?.type?.state === "in" || (matchData as any).status?.type?.state === "post";
                          
                          t1Logo = c1?.team?.logo;
                          t2Logo = c2?.team?.logo;
                          
                          const s1 = parseInt(c1?.score || "0");
                          const s2 = parseInt(c2?.score || "0");
                          
                          t1Score = isLiveOrDone ? (isNaN(s1) ? "0" : Math.max(0, s1).toString()) : "0";
                          t2Score = isLiveOrDone ? (isNaN(s2) ? "0" : Math.max(0, s2).toString()) : "0";
                        } else {
                          // If no match found, check if the stream is too old (fallback)
                          const streamTs = (stream as any).timestamp;
                          if (streamTs && (Date.now() / 1000) - streamTs > 43200) { // 12 hours
                            return null;
                          }
                          // Also hide if it has no timestamp at all (likely old garbage)
                          if (!streamTs) return null;
                        }

                        const startTime = matchData ? formatTime(matchData.date) : formatTime(new Date((stream as any).timestamp * 1000).toISOString());

                        return (
                          <tr key={stream.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", transition: "var(--transition)" }} className="table-row-hover">
                            <td style={{ padding: "20px 12px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-blue)" }}>{startTime}</span>
                                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Local Time</span>
                              </div>
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase" }}>{stream.sport}</span>
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                                  {t1Logo && <img src={t1Logo} alt="" style={{ width: "24px", height: "24px" }} />}
                                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{teams[0]?.trim()}</span>
                                </div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>vs</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                                  {t2Logo && <img src={t2Logo} alt="" style={{ width: "24px", height: "24px" }} />}
                                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{teams[1]?.trim()}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace" }}>
                                <span style={{ color: parseInt(t1Score) > parseInt(t2Score) ? "var(--win-green)" : "inherit" }}>{t1Score}</span>
                                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>-</span>
                                <span style={{ color: parseInt(t2Score) > parseInt(t1Score) ? "var(--win-green)" : "inherit" }}>{t2Score}</span>
                              </div>
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="pulse-live" style={{ width: "6px", height: "6px" }}></span>
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{matchData?.status?.type?.detail || "LiveNow"}</span>
                              </div>
                            </td>
                            <td style={{ padding: "20px 12px", textAlign: "right" }}>
                              <a href={`/stream/${stream.id}`} className="glass" style={{ 
                                padding: "8px 16px", 
                                borderRadius: "8px", 
                                fontSize: "0.85rem", 
                                fontWeight: 700, 
                                textDecoration: "none",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.1)"
                              }}>Watch</a>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                          No live streams available for this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

             <div className="glass-panel" style={{ padding: "30px" }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: "24px" }}>Completed</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {completedGames.length > 0 ? (
                    completedGames.slice(0, 8).map(game => {
                      const c1 = game.competitions[0].competitors[0];
                      const c2 = game.competitions[0].competitors[1];
                      return (
                        <div key={game.id} className="glass" style={{ padding: "15px", borderRadius: "16px", transition: "var(--transition)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                            <span>{game.status.type.detail}</span>
                            <span>{new Date(game.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {c1.team.logo && <img src={c1.team.logo} alt="" style={{ width: "20px", height: "20px" }} />}
                                <span style={{ fontSize: "0.9rem", fontWeight: parseInt(c1.score) > parseInt(c2.score) ? 700 : 400 }}>{c1.team.abbreviation || c1.team.name}</span>
                              </div>
                              <span style={{ fontWeight: 800, color: parseInt(c1.score) > parseInt(c2.score) ? "var(--win-green)" : "inherit" }}>{c1.score}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {c2.team.logo && <img src={c2.team.logo} alt="" style={{ width: "20px", height: "20px" }} />}
                                <span style={{ fontSize: "0.9rem", fontWeight: parseInt(c2.score) > parseInt(c1.score) ? 700 : 400 }}>{c2.team.abbreviation || c2.team.name}</span>
                              </div>
                              <span style={{ fontWeight: 800, color: parseInt(c2.score) > parseInt(c1.score) ? "var(--win-green)" : "inherit" }}>{c2.score}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", opacity: 0.3 }}>
                      <p style={{ fontSize: "0.9rem" }}>No completed games yet</p>
                    </div>
                  )}
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
