"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface Stream {
  id: string;
  title: string;
  sport: string;
  featured?: boolean;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt?: string;
  timestamp?: number;
}

interface Competitor {
  id: string;
  athlete?: {
    id: string;
    displayName: string;
    headshot?: string | { href: string };
    shortName?: string;
  };
  team?: {
    name: string;
    abbreviation: string;
    logo: string;
    displayName: string;
    shortDisplayName?: string;
  };
  score: string;
}

interface ScoreboardEvent {
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
    competitors: Competitor[];
    status?: {
      type: {
        state: string;
        detail: string;
      };
    };
    name?: string;
  }>;
}

interface LiveClientProps {
  initialStreams: Stream[];
  initialScoreboards: Record<string, { events: ScoreboardEvent[] }>;
}

const normalize = (s: string | undefined | null) => {
  if (!s) return "";
  let n = s.toLowerCase();
  // Strip sport prefixes (e.g., "NHL: ", "NBA - ")
  n = n.replace(/^(?:nhl|nba|mlb|nfl|ufc|mma|soccer|football|basketball|hockey)[:\s-]+/, "");
  // Strip common stream noise
  n = n.replace(/\b(?:live|hd|stream|full\s?game|free|watch|online|coverage|exclusive|tv)\b/g, " ");
  // Final alphanumeric only
  return n.replace(/[^a-z0-9]/g, "");
};


const isTerminalState = (state: string | undefined) => {
  const s = state?.toLowerCase() || "";
  return s === "post" || s === "final" || s === "complete" || s === "closed" || s === "canceled" || s === "summary" ||
         s.includes("status_final") || s.includes("status_post") || 
         s.includes("status_closed") || s.includes("status_complete") ||
         s.includes("status_canceled") || s.includes("status_summary");
};

export default function LiveClient({ initialStreams, initialScoreboards }: LiveClientProps) {
  const [streams, setStreams] = useState<Stream[]>(initialStreams);
  const [scoreboards, setScoreboards] = useState<Record<string, { events: ScoreboardEvent[] }>>(initialScoreboards);
  const [selectedSport, setSelectedSport] = useState("All");

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
  const formatTime = (dateStr?: string, detail?: string) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--:--";

    // ESPN often uses 04:00Z (12:00 AM ET) or similar as a placeholder for games
    // if the exact time isn't confirmed yet in the 'date' field.
    // If we have a detail string with a clear time (e.g. "1:00 PM"), we prioritize that.
    if (detail) {
      const timeMatch = detail.match(/(\d{1,2}:\d{2}\s?(?:AM|PM))/i);
      // Only override if the original date looks like a day-placeholder (top of hour, 0 minutes)
      if (timeMatch && date.getUTCMinutes() === 0) {
        return timeMatch[1].toUpperCase();
      }
    }


    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };


  const findMatchForStream = (stream: Stream, scoreboardsData: Record<string, { events: ScoreboardEvent[] }>): ScoreboardEvent | null => {
    const teams = stream.title.split(/\s+(?:vs\.?|at|@|v\.?|VS\.?|AT|V\.?)\s+/i);
    if (teams.length < 2) return null;
    
    const t1Norm = normalize(teams[0] || "");
    const t2Norm = normalize(teams[1] || "");

    let bestEvent: ScoreboardEvent | null = null;

    Object.values(scoreboardsData).forEach(sb => {
      if (!sb || !sb.events) return;
      
      sb.events.forEach(ev => {
        const allComps = ev?.competitions || [];
        const hasMatch = (norm: string) => allComps.some((comp: any) => {
          return (comp.competitors || []).some((c: Competitor) => {
            const cn = normalize(c.team?.name || "");
            const cfn = normalize(c.team?.displayName || c.athlete?.displayName || "");
            const csn = normalize(c.team?.shortDisplayName || c.athlete?.shortName || "");
            return cn.includes(norm) || norm.includes(cn) || cfn.includes(norm) || norm.includes(cfn) || (csn && (csn.includes(norm) || norm.includes(csn)));
          });
        });

        if (hasMatch(t1Norm) && hasMatch(t2Norm)) {
          const evState = ev.status?.type?.state?.toLowerCase();
          const bestState = bestEvent?.status?.type?.state?.toLowerCase();
          
          const getStateScore = (s: string | undefined) => {
            if (!s) return 0;
            if (s === "in" || s.includes("status_in")) return 3; // Best: Live
            if (s === "pre" || s.includes("status_scheduled")) return 2; // Second: Upcoming
            if (isTerminalState(s)) return -1; // Lowest: Finished
            return 1; // Unknown but not finished
          };

          const evScore = getStateScore(evState);
          const bestScore = getStateScore(bestState);

          // Always prefer higher score (Live > Upcoming > Finished)
          // If scores equal, prefer the one with a more recent date/timestamp
          if (!bestEvent || evScore > bestScore || (evScore === bestScore && new Date(ev.date) > new Date(bestEvent.date))) {
            bestEvent = ev as ScoreboardEvent;
          }
        }
      });
    });
    return bestEvent;
  };

  const sports = ["All", "NBA", "NFL", "MLB", "NHL", "Soccer"];
  
  const generateDates = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];
    const now = new Date();
    
    for (let i = -3; i <= 3; i++) {
       const d = new Date();
       d.setDate(now.getDate() + i);
       result.push({
         day: days[d.getDay()],
         date: `${d.getDate()} ${months[d.getMonth()]}`,
         active: i === 0
       });
    }
    return result;
  };

  const dates = generateDates();

  const filteredStreams = selectedSport === "All" 
    ? streams 
    : streams.filter(s => s.sport.toUpperCase() === selectedSport.toUpperCase());

  // Sort streams by start time
  const sortedStreams = [...filteredStreams].sort((a, b) => {
    const ma = findMatchForStream(a, scoreboards);
    const mb = findMatchForStream(b, scoreboards);
    
    const getTs = (s: Stream, m: ScoreboardEvent | null) => {
      if (m && m.date) return new Date(m.date).getTime();
      if (s.timestamp) return s.timestamp * 1000;
      return 0;
    };

    return getTs(a, ma) - getTs(b, mb);
  });

  const featuredStream = streams.find(s => s.featured);

  // Completed matches (status 'post', 'final', 'complete') - keep more for the history sidebar
  const completedMatches = Object.values(scoreboards).flatMap(sb => 
    (sb?.events || []).filter(event => isTerminalState(event.status?.type?.state))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Final filtered list for the "Live Now" table
  const liveStreams = sortedStreams.filter(stream => {
    const currentMatch = findMatchForStream(stream, scoreboards);
    const state = currentMatch?.status?.type?.state;
    
    if (isTerminalState(state)) return false;

    if (!currentMatch) {
      const streamDate = new Date(stream.createdAt || (stream.timestamp ? stream.timestamp * 1000 : Date.now()));
      const diffHours = (Date.now() - streamDate.getTime()) / (1000 * 60 * 60);
      // Aggressive 6h fallback for unknown streams (was 24h)
      if (diffHours > 6) return false;
    } else {
      const s = state?.toLowerCase() || "";
      const isLive = s === "in" || s.includes("status_in") || s.includes("halftime") || s.includes("period");
      const isUpcoming = s === "pre" || s.includes("status_scheduled");

      if (isLive || isUpcoming) {
        const activeMatch = currentMatch as ScoreboardEvent;
        const startTime = new Date(activeMatch.date);
        const diffHours = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
        
        const competitors = activeMatch.competitions?.[0]?.competitors || [];
        const score1 = parseInt(competitors[0]?.score || "0");
        const score2 = parseInt(competitors[1]?.score || "0");

        // Only hide if it's way past start time AND still 0-0 AND NOT explicitly "in progress"
        if (diffHours > 8 && score1 === 0 && score2 === 0 && !isLive) return false;
      }
    }
    return true;
  });

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#060606", 
      color: "#fff",
      display: "flex"
    }}>
      <Sidebar />

      {/* Main Container */}
      <div style={{ 
        marginLeft: "96px", 
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
             <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="logo" style={{ fontSize: "1.8rem" }}>
                   Caffeine Live
                </div>
             </a>
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
                      if (!featuredStream) return null;
                      
                      const featuredMatch = findMatchForStream(featuredStream, scoreboards);
                      const isMma = featuredStream.sport?.toUpperCase() === "UFC" || featuredStream.sport?.toUpperCase() === "MMA";
                      
                      let t1Name = "";
                      let t2Name = "";
                      let t1Logo = null, t2Logo = null;
                      let t1Score: string | null = null, t2Score: string | null = null;

                      if (isMma && featuredMatch) {
                          const activeMatch = featuredMatch as ScoreboardEvent;
                          const allComps = activeMatch.competitions || [];
                          // MMA: Main event is the LAST competition on the card
                          const mainEventComp = allComps[allComps.length - 1];
                          const competitors = mainEventComp?.competitors || [];
                          
                          // MMA: Prioritize Athlete names over Team objects
                          const ath1 = competitors[0]?.athlete;
                          const ath2 = competitors[1]?.athlete;
                          const team1 = competitors[0]?.team;
                          const team2 = competitors[1]?.team;

                          t1Name = ath1?.displayName || team1?.displayName || team1?.name || "TBD";
                          t2Name = ath2?.displayName || team2?.displayName || team2?.name || "TBD";
                          
                          const resolveImg = (ath: any, comp: any) => {
                            if (!ath && !comp) return null;
                            // 1. Check for standard headshot
                            if (ath?.headshot) return typeof ath.headshot === 'string' ? ath.headshot : ath.headshot.href;
                            // 2. Check for photo/portrait fields
                            if (ath?.photo) return ath.photo;
                            if (ath?.portrait) return ath.portrait;
                            // 3. Fallback to common href in links
                            if (ath?.links?.find((l: any) => l.rel?.includes('player') || l.rel?.includes('athlete'))?.href) {
                               return ath.links.find((l: any) => l.rel?.includes('player') || l.rel?.includes('athlete')).href;
                            }
                            // 4. Fallback: Construct ESPN MMA headshot URL based on competitor ID if available
                            if (isMma && comp?.id) {
                               return `https://a.espncdn.com/i/headshots/mma/players/full/${comp.id}.png`;
                            }
                            // 5. Fallback to generic logos
                            return comp?.team?.logo || comp?.logo || comp?.image || null;
                          };

                          t1Logo = resolveImg(ath1, competitors[0]);
                          t2Logo = resolveImg(ath2, competitors[1]);
                          
                          const s = mainEventComp?.status?.type?.state?.toLowerCase() || activeMatch.status?.type?.state?.toLowerCase();
                          const isLiveOrDone = s === "in" || isTerminalState(s);
                          
                          if (isLiveOrDone) {
                            t1Score = competitors[0]?.score || "0";
                            t2Score = competitors[1]?.score || "0";
                          } else {
                            t1Score = "0";
                            t2Score = "0";
                          }
                      } else {
                          // Standard Team Sport: Split title
                          const teams = featuredStream.title.split(/\s+(?:vs\.?|at|@|v\.?|VS\.?|AT|V\.?)\s+/i);
                          t1Name = teams[0]?.trim() || "";
                          t2Name = teams[1]?.trim() || "";

                          if (featuredMatch) {
                            const activeMatch = featuredMatch as ScoreboardEvent;
                            const t1N = normalize(t1Name);
                            const t2N = normalize(t2Name);
                            const competitors = activeMatch.competitions?.[0]?.competitors || [];
                            
                            const c1 = competitors.find((c: Competitor) => {
                               const cn = normalize(c.team?.name);
                               const cfn = normalize(c.team?.displayName);
                               return cn.includes(t1N) || t1N.includes(cn) || cfn.includes(t1N) || t1N.includes(cfn);
                            });
                            const c2 = competitors.find((c: Competitor) => {
                               const cn = normalize(c.team?.name);
                               const cfn = normalize(c.team?.displayName);
                               return cn.includes(t2N) || t2N.includes(cn) || cfn.includes(t2N) || t2N.includes(cfn);
                            });
                            
                            const s = activeMatch.status?.type?.state?.toLowerCase();
                            const isLiveOrDone = s === "in" || isTerminalState(s);
                            
                            if (c1 && c1.team) { 
                              t1Logo = c1.team.logo; 
                              const sc = parseInt(c1.score);
                              t1Score = isLiveOrDone ? (isNaN(sc) ? "0" : Math.max(0, sc).toString()) : "0"; 
                            }
                            if (c2 && c2.team) { 
                              t2Logo = c2.team.logo; 
                              const sc = parseInt(c2.score);
                              t2Score = isLiveOrDone ? (isNaN(sc) ? "0" : Math.max(0, sc).toString()) : "0"; 
                            }
                          }
                      }

                      return (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "60px", marginBottom: "30px" }}>
                          <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ 
                              fontSize: "1rem", 
                              color: "var(--accent-blue)", 
                              fontWeight: 700, 
                              textTransform: "uppercase", 
                              marginBottom: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}>
                              {featuredStream.sport?.toUpperCase() === "UFC" && (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/UFC_Logo.png" alt="UFC" style={{ height: "14px", opacity: 0.8 }} />
                              )}
                              <span>{!isMma ? featuredStream.sport : (featuredMatch?.name?.split(':')?.[0]?.trim() || featuredStream.sport)}</span>
                            </div>
                            <div style={{ position: "relative", marginBottom: "15px" }}>
                              {t1Logo && (
                                <>
                                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120%", height: "120%", background: "radial-gradient(circle, rgba(0, 150, 255, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
                                  <img 
                                    src={t1Logo} 
                                    alt="" 
                                    style={{ 
                                      width: isMma ? "120px" : "80px", 
                                      height: isMma ? "120px" : "80px", 
                                      borderRadius: isMma ? "50%" : "0",
                                      objectFit: "cover",
                                      filter: "drop-shadow(0 0 15px rgba(255,255,255,0.3))",
                                      position: "relative",
                                      zIndex: 1
                                    }} 
                                  />
                                </>
                              )}
                              {!t1Logo && isMma && <div style={{ fontSize: "4rem" }}>🥋</div>}
                            </div>
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t1Name}</h3>
                            {t1Score !== null && !isMma && <div style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "10px" }}>{t1Score}</div>}
                          </div>
                          
                          <div style={{ textAlign: "center", minWidth: "150px" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-muted)", marginBottom: "5px" }}>VS</div>
                            {featuredMatch && (
                              <div className="glass" style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                                {isTerminalState((featuredMatch as ScoreboardEvent).status.type.state) ? "Final" : 
                                 (featuredMatch as ScoreboardEvent).status.type.state === "pre" ? `Starts ${formatTime((featuredMatch as ScoreboardEvent).date)}` : (featuredMatch as ScoreboardEvent).status.type.detail}
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{ fontSize: "1rem", color: "transparent", userSelect: "none", marginBottom: "10px" }}>.</div>
                            <div style={{ position: "relative", marginBottom: "15px" }}>
                              {t2Logo && (
                                <>
                                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120%", height: "120%", background: "radial-gradient(circle, rgba(231, 76, 60, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
                                  <img 
                                    src={t2Logo} 
                                    alt="" 
                                    style={{ 
                                      width: isMma ? "120px" : "80px", 
                                      height: isMma ? "120px" : "80px", 
                                      borderRadius: isMma ? "50%" : "0",
                                      objectFit: "cover",
                                      filter: "drop-shadow(0 0 15px rgba(255,255,255,0.3))",
                                      position: "relative",
                                      zIndex: 1
                                    }} 
                                  />
                                </>
                              )}
                              {!t2Logo && isMma && <div style={{ fontSize: "4rem" }}>🥋</div>}
                            </div>
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t2Name}</h3>
                            {t2Score !== null && !isMma && <div style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "10px" }}>{t2Score}</div>}
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
                    {liveStreams.length > 0 ? (
                      liveStreams.map((stream) => {
                        const teams = stream.title.split(/\s+(?:vs\.?|at|@|v\.?|VS\.?|AT|V\.?)\s+/i);
                        const t1N = normalize(teams[0]);
                        const t2N = normalize(teams[1]);
                        
                        const currentMatch = findMatchForStream(stream, scoreboards);
                        let t1Logo = null, t2Logo = null;
                        let t1Score = "0", t2Score = "0";

                        if (currentMatch) {
                          const activeMatch = currentMatch as ScoreboardEvent;
                          const competitors = activeMatch.competitions?.[0]?.competitors || [];
                          const c1 = competitors.find((c: Competitor) => {
                             const cn = normalize(c.team?.name);
                             const cfn = normalize(c.team?.displayName);
                             const csn = normalize(c.team?.shortDisplayName);
                             return cn.includes(t1N) || t1N.includes(cn) || cfn.includes(t1N) || t1N.includes(cfn) || (csn && (csn.includes(t1N) || t1N.includes(csn)));
                          });
                          const c2 = competitors.find((c: Competitor) => {
                             const cn = normalize(c.team?.name);
                             const cfn = normalize(c.team?.displayName);
                             const csn = normalize(c.team?.shortDisplayName);
                             return cn.includes(t2N) || t2N.includes(cn) || cfn.includes(t2N) || t2N.includes(cfn) || (csn && (csn.includes(t2N) || t2N.includes(csn)));
                          });
                          
                          const s = activeMatch.status?.type?.state?.toLowerCase();
                          const isLiveOrDone = s === "in" || s?.includes("status_in") || isTerminalState(s);
                          
                          t1Logo = c1?.team?.logo;
                          t2Logo = c2?.team?.logo;
                          
                          const sc1 = parseInt(c1?.score || "0");
                          const sc2 = parseInt(c2?.score || "0");
                          
                          t1Score = isLiveOrDone ? (isNaN(sc1) ? "0" : Math.max(0, sc1).toString()) : "0";
                          t2Score = isLiveOrDone ? (isNaN(sc2) ? "0" : Math.max(0, sc2).toString()) : "0";
                        } 

                        const statusDetail = currentMatch?.status?.type?.detail || "LiveNow";
                        let startTime = currentMatch ? formatTime(currentMatch.date, statusDetail) : formatTime(stream.timestamp ? new Date(stream.timestamp * 1000).toISOString() : undefined);
                        
                        // Prevent confusing "12:00 AM" discovery placeholders when matching fails.
                        // We use a regex to handle different space characters (like narrow non-breaking space)
                        // and case variations that toLocaleTimeString might produce.
                        if (!currentMatch && /^12:00\s?(AM|PM)$/i.test(startTime.replace(/\s/g, " "))) {
                          startTime = "Upcoming";
                        }


                        
                        const matchState = currentMatch?.status?.type?.state?.toLowerCase() || "";
                        const isLive = matchState === "in" || matchState.includes("status_in") || matchState.includes("halftime") || matchState.includes("period");
                        const isUpcoming = matchState === "pre" || matchState.includes("status_scheduled");
                        const isMmaRow = stream.sport?.toUpperCase() === "UFC" || stream.sport?.toUpperCase() === "MMA";

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
                                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{teams[0]?.trim() || ""}</span>
                                </div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>vs</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                                  {t2Logo && <img src={t2Logo} alt="" style={{ width: "24px", height: "24px" }} />}
                                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{teams[1]?.trim() || ""}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              {!isMmaRow && (
                                <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace" }}>
                                  <span style={{ color: parseInt(t1Score) > parseInt(t2Score) ? "var(--win-green)" : "inherit" }}>{t1Score}</span>
                                  <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>-</span>
                                  <span style={{ color: parseInt(t2Score) > parseInt(t1Score) ? "var(--win-green)" : "inherit" }}>{t2Score}</span>
                                </div>
                              )}
                              {isMmaRow && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>---</span>}
                            </td>
                            <td style={{ padding: "20px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isLive && <span className="pulse-live" style={{ width: "6px", height: "6px" }}></span>}
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                  {isUpcoming ? (statusDetail === "LiveNow" ? "Scheduled" : statusDetail) : statusDetail}
                                </span>
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
                  {completedMatches.length > 0 ? (
                    completedMatches.slice(0, 8).map(game => {
                      const activeGame = game as ScoreboardEvent;
                      const c1 = activeGame.competitions?.[0]?.competitors?.[0];
                      const c2 = activeGame.competitions?.[0]?.competitors?.[1];

                      if (!c1?.team || !c2?.team) return null;

                      const s1 = parseInt(c1.score || "0");
                      const s2 = parseInt(c2.score || "0");

                      return (
                        <div key={activeGame.id} className="glass" style={{ padding: "15px", borderRadius: "16px", transition: "var(--transition)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                            <span>{activeGame.status?.type?.detail || "Completed"}</span>
                            <span>{activeGame.date ? new Date(activeGame.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {c1.team.logo && <img src={c1.team.logo} alt="" style={{ width: "20px", height: "20px" }} />}
                                <span style={{ fontSize: "0.9rem", fontWeight: s1 > s2 ? 700 : 400 }}>{c1.team?.abbreviation || c1.team?.name || "Team"}</span>
                              </div>
                              <span style={{ fontWeight: 800, color: s1 > s2 ? "var(--win-green)" : "inherit" }}>{c1.score}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {c2.team.logo && <img src={c2.team.logo} alt="" style={{ width: "20px", height: "20px" }} />}
                                <span style={{ fontSize: "0.9rem", fontWeight: s2 > s1 ? 700 : 400 }}>{c2.team?.abbreviation || c2.team?.name || "Team"}</span>
                              </div>
                              <span style={{ fontWeight: 800, color: s2 > s1 ? "var(--win-green)" : "inherit" }}>{c2.score}</span>
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
