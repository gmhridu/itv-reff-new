import WatchVideo from "@/components/watch-video";
import React from "react";

interface WatchVideoPageProps {
  params: Promise<{ id: string }>;
}

const WatchVideoPage = async ({ params }: WatchVideoPageProps) => {
  const { id } = await params;

  if (!id) return null;

  return (
    <div>
      <WatchVideo videoId={id} />
    </div>
  );
};

export default WatchVideoPage;
