import { getMediaDetails, getRecommendations, getCollectionDetails } from "@/lib/tmdb";
import TitleClient from "@/app/title/[type]/[id]/TitleClient";
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

  let collection: any[] = [];
  if (details.belongs_to_collection) {
    collection = await getCollectionDetails(details.belongs_to_collection.id);
    // Filter out the current movie from the collection row
    collection = collection.filter(item => item.id.toString() !== id.toString());
  }

  return (
    <TitleClient 
      details={details} 
      recommendations={recommendations} 
      collection={collection}
    />
  );
}
