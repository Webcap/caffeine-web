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
    const [streamsRes, scoreboardsRes, configRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' }),
      fetch(`${API_URL}/config`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) {
      allStreams = await streamsRes.json();
      stream = allStreams.find((s: any) => s.id === id);
    }

    if (scoreboardsRes.ok) {
      scoreboards = await scoreboardsRes.json();
    }

    if (configRes.ok) {
      const config = await configRes.json();
      showScores = config.web_stream_scores_enabled ?? true;
      showLive = config.web_live_sports_enabled ?? true;
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
