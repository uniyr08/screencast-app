'use client';

import { useEffect, useState } from 'react';
import { supabase, VideoRecord } from '@/lib/supabase';
import { ClickThriveLogo } from '@/components/Logo';

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setVideos(data);
    setLoading(false);
  };

  const copyLink = (shareId: string) => {
    const url = `${window.location.origin}/v/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteVideo = async (video: VideoRecord) => {
    await supabase.storage.from('recordings').remove([video.file_path]);
    if (video.thumbnail_path) {
      await supabase.storage.from('recordings').remove([video.thumbnail_path]);
    }
    await supabase.from('videos').delete().eq('id', video.id);
    setDeleteConfirm(null);
    loadVideos();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getThumbnailUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('recordings').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <ClickThriveLogo size="md" />
          </a>
          <a href="/record" className="text-sm px-5 py-2.5 rounded-lg text-white font-medium transition-smooth"
            style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
            + New Recording
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Recordings</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {videos.length} recording{videos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-2xl mb-3">&#x23F3;</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading recordings...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">&#x1F3AC;</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No recordings yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Create your first recording and it will appear here.</p>
            <a href="/record" className="inline-block px-6 py-3 rounded-lg text-white font-medium transition-smooth mt-4"
              style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
              Start Recording
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
              <div key={video.id} className="glass-card overflow-hidden group transition-smooth hover:border-blue-800/30">
                <a href={`/v/${video.share_id}`} className="block relative" style={{ aspectRatio: '16/9', background: 'var(--bg-tertiary)' }}>
                  {video.thumbnail_path ? (
                    <img src={getThumbnailUrl(video.thumbnail_path) || ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0000FF" strokeWidth="1.5" opacity="0.4">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="10 8 16 12 10 16 10 8" fill="#0000FF" stroke="none" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-mono font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    {formatDuration(video.duration)}
                  </div>
                </a>

                <div className="p-4 space-y-3">
                  <div>
                    <a href={`/v/${video.share_id}`} className="font-medium text-sm line-clamp-1 hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {video.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(video.created_at)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>&#x00B7;</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatSize(video.file_size)}</span>
                      {video.metadata?.client_name && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>&#x00B7;</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: '#4D4DFF' }}>
                            {video.metadata.client_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(video.share_id)}
                      className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-smooth"
                      style={{ background: copiedId === video.share_id ? 'rgba(34,197,94,0.15)' : 'var(--bg-tertiary)',
                        color: copiedId === video.share_id ? '#22C55E' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)' }}>
                      {copiedId === video.share_id ? '\u2713 Copied!' : '\uD83D\uDD17 Copy Link'}
                    </button>
                    <span className="text-xs flex items-center gap-1 px-2" style={{ color: 'var(--text-secondary)' }}>
                      &#x1F441; {video.views}
                    </span>
                    {deleteConfirm === video.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteVideo(video)} className="px-2 py-1.5 rounded text-xs font-medium text-red-400 transition-smooth"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Yes
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 rounded text-xs transition-smooth"
                          style={{ color: 'var(--text-secondary)' }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(video.id)} className="px-2 py-1.5 rounded text-xs transition-smooth"
                        style={{ color: 'var(--text-secondary)' }} title="Delete">
                        &#x1F5D1;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}