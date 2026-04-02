import { getMediaDetails, getRecommendations } from "@/lib/tmdb";
import TitleClient from "./TitleClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface TitlePageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { type, id } = await params;
  
  if (type !== "movie" && type !== "tv") {
    notFound();
  }

  const [details, recommendations] = await Promise.all([
    getMediaDetails(id, type),
    getRecommendations(id, type)
  ]);

  if (!details) {
    notFound();
  }

  return (
    <TitleClient 
      details={details} 
      recommendations={recommendations} 
    />
  );
}
