import VideoPlayer from './VideoPlayer';

export default function Page({ params }: { params: { shareId: string } }) {
  return <VideoPlayer shareId={params.shareId} />;
}
