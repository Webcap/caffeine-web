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

  try {
    const [streamsRes, scoreboardsRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) {
      allStreams = await streamsRes.json();
      stream = allStreams.find((s: any) => s.id === id);
    }

    if (scoreboardsRes.ok) {
      scoreboards = await scoreboardsRes.json();
    }
  } catch (e) {
    console.error("Failed to fetch stream data on server:", e);
  }

  if (!stream) {
    notFound();
  }

  return (
    <StreamClient 
      stream={stream} 
      allStreams={allStreams} 
      scoreboards={scoreboards} 
    />
  );
}
