import LiveClient from "./LiveClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  let initialStreams = [];
  let initialScoreboards = {};
  let showLive = true;

  try {
    const env = process.env.NODE_ENV === "development" ? "development" : "production";
    
    const [streamsRes, scoreboardsRes, configRes, flagsRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' }),
      fetch(`${API_URL}/config`, { cache: 'no-store' }),
      fetch(`${API_URL}/v1/feature-flags?platform=web&env=${env}`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) initialStreams = await streamsRes.json();
    if (scoreboardsRes.ok) initialScoreboards = await scoreboardsRes.json();
    
    let config: any = {};
    if (configRes.ok) config = await configRes.json();
    
    let featureFlags: any = {};
    if (flagsRes.ok) featureFlags = await flagsRes.json();

    // Priority: New system, then legacy config, then default true
    if (featureFlags && featureFlags.web_live_sports_enabled !== undefined) {
      showLive = featureFlags.web_live_sports_enabled === true;
    } else {
      showLive = config.web_live_sports_enabled ?? true;
    }
  } catch (e) {
    console.error("Failed to fetch initial sports data or config on server:", e);
  }

  if (!showLive) {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  return (
    <LiveClient 
      initialStreams={Array.isArray(initialStreams) ? initialStreams : []} 
      initialScoreboards={initialScoreboards} 
    />
  );
}
