'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoItem {
  shareId: string;
  title: string;
  client: string;
  duration: number;
  createdAt: string;
  videoUrl: string;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      // List all files in the videos folder
      const { data: files, error } = await supabase.storage
        .from('recordings')
        .list('videos', { sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !files) {
        setLoading(false);
        return;
      }

      // Get only .json metadata files
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));

      // Download each metadata file
      const videoList: VideoItem[] = [];
      for (const file of jsonFiles) {
        try {
          const { data: metaData } = await supabase.storage
            .from('recordings')
            .download(`videos/${file.name}`);

          if (metaData) {
            const text = await metaData.text();
            const meta = JSON.parse(text);
            const shareId = file.name.replace('.json', '');

            const { data: urlData } = supabase.storage
              .from('recordings')
              .getPublicUrl(`videos/${shareId}.webm`);

            videoList.push({
              shareId,
              title: meta.title || 'Untitled Recording',
              client: meta.client || '',
              duration: meta.duration || 0,
              createdAt: meta.createdAt || file.created_at,
              videoUrl: urlData?.publicUrl || '',
            });
          }
        } catch {}
      }

      // Sort newest first
      videoList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVideos(videoList);
    } catch {}
    setLoading(false);
  };

  const copyLink = (shareId: string) => {
    const url = `${window.location.origin}/v/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteVideo = async (shareId: string) => {
    await supabase.storage.from('recordings').remove([
      `videos/${shareId}.webm`,
      `videos/${shareId}.json`,
    ]);
    setDeleteConfirm(null);
    loadVideos();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
              </svg>
            </div>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ScreenCast</span>
          </a>
          <a href="/record" className="text-sm px-5 py-2.5 rounded-lg text-white font-medium transition-smooth"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
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
            <div className="text-2xl mb-3">⏳</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading recordings...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🎬</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No recordings yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Create your first recording and it will appear here.</p>
            <a href="/record" className="inline-block px-6 py-3 rounded-lg text-white font-medium transition-smooth mt-4"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              Start Recording
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
              <div key={video.shareId} className="glass-card overflow-hidden group transition-smooth hover:border-blue-500/30">
                {/* Thumbnail */}
                <a href={`/v/${video.shareId}`} className="block relative" style={{ aspectRatio: '16/9', background: 'var(--bg-tertiary)' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" opacity="0.4">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="#3B82F6" stroke="none" />
                    </svg>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-mono font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    {formatDuration(video.duration)}
                  </div>
                </a>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <a href={`/v/${video.shareId}`} className="font-medium text-sm line-clamp-1 hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {video.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(video.createdAt)}</span>
                      {video.client && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: '#60A5FA' }}>
                            {video.client}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(video.shareId)}
                      className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-smooth"
                      style={{ background: copiedId === video.shareId ? 'rgba(34,197,94,0.15)' : 'var(--bg-tertiary)',
                        color: copiedId === video.shareId ? '#22C55E' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)' }}>
                      {copiedId === video.shareId ? '✓ Copied!' : '🔗 Copy Link'}
                    </button>
                    {deleteConfirm === video.shareId ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteVideo(video.shareId)} className="px-2 py-1.5 rounded text-xs font-medium text-red-400 transition-smooth"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Yes
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 rounded text-xs transition-smooth"
                          style={{ color: 'var(--text-secondary)' }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(video.shareId)} className="px-2 py-1.5 rounded text-xs transition-smooth"
                        style={{ color: 'var(--text-secondary)' }} title="Delete">
                        🗑
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