import LiveClient from "./LiveClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const API_URL = process.env.NEXT_PUBLIC_CAFFEINE_API_URL || "https://caffeine-api.vercel.app";

  let initialStreams = [];
  let initialScoreboards = {};
  let showLive = true;

  try {
    const [streamsRes, scoreboardsRes, configRes] = await Promise.all([
      fetch(`${API_URL}/sports/streams`, { cache: 'no-store' }),
      fetch(`${API_URL}/sports/scoreboard/all`, { cache: 'no-store' }),
      fetch(`${API_URL}/config`, { cache: 'no-store' })
    ]);

    if (streamsRes.ok) initialStreams = await streamsRes.json();
    if (scoreboardsRes.ok) initialScoreboards = await scoreboardsRes.json();
    if (configRes.ok) {
      const config = await configRes.json();
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
