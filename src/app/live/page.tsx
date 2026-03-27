import LiveClient from "./LiveClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  let initialStreams = [];
  let initialScoreboards = {};

  try {
    const [streamsRes, scoreboardsRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) initialStreams = await streamsRes.json();
    if (scoreboardsRes.ok) initialScoreboards = await scoreboardsRes.json();
  } catch (e) {
    console.error("Failed to fetch initial sports data on server:", e);
  }

  return (
    <LiveClient 
      initialStreams={Array.isArray(initialStreams) ? initialStreams : []} 
      initialScoreboards={initialScoreboards} 
    />
  );
}
