import WatchVideo from '@/components/watch-video';
import React from 'react'

const WatchVideoPage = async ({ params }) => {
  const { id } = await params;


  if(!id) return null;

  return (
    <div>
      <WatchVideo videoId={id}/>
    </div>
  )
}

export default WatchVideoPage
