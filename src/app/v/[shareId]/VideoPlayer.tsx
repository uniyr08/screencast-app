'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, VideoRecord, Comment } from '@/lib/supabase';
import { ClickThriveLogo } from '@/components/Logo';

export default function VideoPlayer({ shareId }: { shareId: string }) {
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentType, setCommentType] = useState<Comment['type']>('comment');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadVideo();
  }, [shareId]);

  const loadVideo = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setVideo(data);

    await supabase
      .from('videos')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);

    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(data.file_path);

    setVideoUrl(urlData.publicUrl);

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', data.id)
      .order('created_at', { ascending: true });

    if (commentsData) setComments(commentsData);
    setLoading(false);
  };

  const addComment = async () => {
    if (!newComment.trim() || !video) return;

    const comment = {
      video_id: video.id,
      user_name: commentName || 'Anonymous',
      content: newComment,
      timestamp_seconds: Math.floor(currentTime),
      type: commentType,
    };

    const { data, error } = await supabase.from('comments').insert(comment).select().single();
    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setCurrentTime(videoRef.current.currentTime);
    if (dur && isFinite(dur) && dur > 0) {
      setProgress((videoRef.current.currentTime / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && isFinite(dur) && dur > 0) {
      setVideoDuration(dur);
    }
  };

  // Also listen for durationchange in case metadata loads late (webm files)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onDurationChange = () => {
      const dur = vid.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setVideoDuration(dur);
      }
    };
    vid.addEventListener('durationchange', onDurationChange);
    return () => vid.removeEventListener('durationchange', onDurationChange);
  }, [videoUrl]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!dur || !isFinite(dur)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * dur;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const commentTypeConfig = {
    comment: { emoji: '\uD83D\uDCAC', label: 'Comment', color: '#8B92A5' },
    issue: { emoji: '\uD83D\uDD34', label: 'Issue', color: '#EF4444' },
    win: { emoji: '\u2705', label: 'Win', color: '#22C55E' },
    action_item: { emoji: '\uD83D\uDCCB', label: 'Action Item', color: '#F59E0B' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-3">
          <div className="text-3xl">&#x23F3;</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading video...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-3">
          <div className="text-5xl">&#x1F50D;</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Video Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>This recording may have been deleted or the link is incorrect.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2 rounded-lg text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <ClickThriveLogo size="sm" />
          </a>
          <button onClick={copyLink} className="text-sm px-4 py-1.5 rounded-lg transition-smooth"
            style={{ background: copiedLink ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
              color: copiedLink ? '#22C55E' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            {copiedLink ? '\u2713 Link Copied!' : '\uD83D\uDD17 Share'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-xl overflow-hidden" style={{ background: '#000' }}>
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                className="w-full cursor-pointer"
                style={{ maxHeight: '500px' }}
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                preload="metadata"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20" onClick={togglePlay}>
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#1a1e28">
                      <polygon points="8 5 19 12 8 19 8 5" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="relative h-1.5 rounded-full cursor-pointer group" style={{ background: 'var(--bg-tertiary)' }}
                onClick={handleProgressClick}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0000FF, #4D4DFF)' }} />
                {comments.filter(c => c.timestamp_seconds !== null).map((c, i) => {
                  const markerPos = videoDuration > 0 ? ((c.timestamp_seconds || 0) / videoDuration) * 100 : 0;
                  return (
                    <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-150 transition-transform"
                      style={{
                        left: `${markerPos}%`,
                        background: commentTypeConfig[c.type]?.color || '#8B92A5',
                        border: '2px solid var(--bg-primary)',
                      }}
                      onClick={(e) => { e.stopPropagation(); seekTo(c.timestamp_seconds || 0); }}
                      title={`${commentTypeConfig[c.type]?.emoji} ${c.content}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
            </div>

            {/* Video info */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{video?.title}</h1>
              <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>{video ? new Date(video.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                <span>&#x00B7;</span>
                <span>{video ? formatTime(video.duration) : ''}</span>
                <span>&#x00B7;</span>
                <span>&#x1F441; {video?.views} views</span>
                {video?.metadata?.client_name && (
                  <>
                    <span>&#x00B7;</span>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: '#4D4DFF' }}>
                      {video.metadata.client_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comments panel */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Comments &amp; Feedback ({comments.length})
            </h3>

            <div className="glass-card p-4 space-y-3">
              <input type="text" value={commentName} onChange={(e) => setCommentName(e.target.value)}
                placeholder="Your name" className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a comment at ${formatTime(currentTime)}...`} rows={2}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              <div className="flex items-center gap-2">
                {(Object.entries(commentTypeConfig) as [Comment['type'], typeof commentTypeConfig.comment][]).map(([type, config]) => (
                  <button key={type} onClick={() => setCommentType(type)}
                    className="px-2 py-1 rounded text-xs transition-smooth"
                    style={{
                      background: commentType === type ? `${config.color}20` : 'transparent',
                      color: commentType === type ? config.color : 'var(--text-secondary)',
                      border: `1px solid ${commentType === type ? `${config.color}40` : 'transparent'}`,
                    }}>
                    {config.emoji} {config.label}
                  </button>
                ))}
              </div>
              <button onClick={addComment} disabled={!newComment.trim()}
                className="w-full py-2 rounded-lg text-xs font-medium text-white transition-smooth disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
                Post at {formatTime(currentTime)}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const config = commentTypeConfig[comment.type] || commentTypeConfig.comment;
                  return (
                    <div key={comment.id} className="glass-card p-3 space-y-1.5 cursor-pointer transition-smooth"
                      onClick={() => seekTo(comment.timestamp_seconds || 0)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{config.emoji}</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{comment.user_name}</span>
                        </div>
                        {comment.timestamp_seconds !== null && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: '#4D4DFF' }}>
                            {formatTime(comment.timestamp_seconds)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{comment.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t mt-8 py-4 text-center" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Powered by <span className="font-semibold" style={{ color: '#0000FF' }}>Click Thrive Marketing</span>
        </p>
      </footer>
    </div>
  );
}