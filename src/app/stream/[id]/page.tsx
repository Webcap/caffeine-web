import StreamClient from "./StreamClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface StreamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StreamPage({ params }: StreamPageProps) {
  const { id } = await params;
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  let stream = null;
  let allStreams = [];
  let scoreboards = {};

  let showScores = true;
  let showLive = true;

  try {
    const env = process.env.NODE_ENV === "development" ? "development" : "production";

    const [streamsRes, scoreboardsRes, configRes, flagsRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' }),
      fetch(`${API_URL}/config`, { cache: 'no-store' }),
      fetch(`${API_URL}/v1/feature-flags?platform=web&env=${env}`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) {
      allStreams = await streamsRes.json();
      stream = allStreams.find((s: any) => s.id === id);
    }

    if (scoreboardsRes.ok) {
      scoreboards = await scoreboardsRes.json();
    }

    let config: any = {};
    if (configRes.ok) config = await configRes.json();

    let featureFlags: any = {};
    if (flagsRes.ok) featureFlags = await flagsRes.json();

    // Priority: New system, then legacy config, then default true
    if (featureFlags) {
      // enable_ott replaces the old web_live_sports_enabled for consistent universal control
      if (featureFlags.enable_ott !== undefined) {
        showLive = featureFlags.enable_ott === true;
      } else {
        showLive = config.enable_ott ?? true;
      }
      
      // Scores are now always enabled by default if OTT is on
      showScores = true;
    }
  } catch (e) {
    console.error("Failed to fetch stream data or config on server:", e);
  }

  if (!showLive) {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  if (!stream) {
    notFound();
  }

  return (
    <StreamClient 
      stream={stream} 
      allStreams={allStreams} 
      scoreboards={scoreboards} 
      showScores={showScores}
    />
  );
}
