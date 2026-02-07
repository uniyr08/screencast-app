'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoMeta {
  title: string;
  client: string;
  duration: number;
  createdAt: string;
}

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: number;
  createdAt: string;
}

export default function VideoPlayer({ shareId }: { shareId: string }) {
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(`videos/${shareId}.webm`);

    if (urlData?.publicUrl) {
      setVideoUrl(urlData.publicUrl);
    }

    supabase.storage
      .from('recordings')
      .download(`videos/${shareId}.json`)
      .then(({ data, error: metaError }) => {
        if (data && !metaError) {
          data.text().then(text => {
            try { setMeta(JSON.parse(text)); } catch {}
          });
        }
      })
      .catch(() => {});

    loadComments();
    setLoading(false);
  }, [shareId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('recordings')
        .download(`videos/${shareId}-comments.json`);
      if (data && !error) {
        const text = await data.text();
        setComments(JSON.parse(text));
      }
    } catch {}
  };

  const saveComment = async () => {
    if (!commentText.trim() || !commentName.trim()) return;
    setIsSubmitting(true);

    const newComment: Comment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: commentName.trim(),
      text: commentText.trim(),
      timestamp: commentTimestamp,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment].sort((a, b) => a.timestamp - b.timestamp);

    try {
      await supabase.storage.from('recordings').remove([`videos/${shareId}-comments.json`]);
      await supabase.storage
        .from('recordings')
        .upload(`videos/${shareId}-comments.json`, JSON.stringify(updatedComments), {
          contentType: 'application/json',
          upsert: false,
        });
      setComments(updatedComments);
      setCommentText('');
    } catch (err) {
      console.error('Failed to save comment:', err);
    }
    setIsSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    try {
      await supabase.storage.from('recordings').remove([`videos/${shareId}-comments.json`]);
      if (updatedComments.length > 0) {
        await supabase.storage
          .from('recordings')
          .upload(`videos/${shareId}-comments.json`, JSON.stringify(updatedComments), {
            contentType: 'application/json',
            upsert: false,
          });
      }
      setComments(updatedComments);
    } catch {}
  };

  const jumpToTimestamp = (timestamp: number) => {
    if (videoRef.current && isFinite(timestamp)) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const addCommentAtCurrentTime = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setCommentTimestamp(Math.floor(videoRef.current.currentTime));
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0; }
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !videoDuration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * videoDuration;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) { await containerRef.current.requestFullscreen(); setIsFullscreen(true); }
    else { await document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) { controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000); }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const skip = (seconds: number) => {
    if (videoRef.current && videoDuration) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoDuration));
    }
  };

  useEffect(() => {
    const rounded = Math.floor(currentTime);
    const active = comments.find(c => c.timestamp === rounded);
    setActiveComment(active || null);
  }, [currentTime, comments]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-10); break;
        case 'ArrowRight': e.preventDefault(); skip(10); break;
        case 'c': e.preventDefault(); addCommentAtCurrentTime(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, volume, videoDuration, comments]);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: '3px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <div className="text-5xl">📹</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Video Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'This video may have been deleted or the link is invalid.'}</p>
          <a href="/record" className="inline-block px-6 py-3 rounded-lg text-sm font-semibold text-white transition-smooth hover:scale-105"
             style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>Record a New Video</a>
        </div>
      </div>
    );
  }

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
              </svg>
            </div>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ScreenCast</span>
          </a>
          <a href="/record" className="text-sm px-4 py-2 rounded-lg transition-smooth text-white font-medium"
             style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>Record Your Own</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div ref={containerRef} className="relative rounded-xl overflow-hidden group" style={{ background: '#000', aspectRatio: '16/9' }}
             onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}>
          
          <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain cursor-pointer" onClick={togglePlay}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onLoadedMetadata={() => videoRef.current && setVideoDuration(videoRef.current.duration)}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setShowControls(true); }} playsInline />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center transition-smooth hover:scale-110"
                   style={{ background: 'rgba(59, 130, 246, 0.9)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="8 5 19 12 8 19 8 5" /></svg>
              </div>
            </div>
          )}

          {activeComment && isPlaying && (
            <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none" style={{ zIndex: 10 }}>
              <div className="px-4 py-2 rounded-lg text-sm text-white max-w-md text-center"
                   style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                <span className="font-semibold text-blue-400">{activeComment.name}</span>: {activeComment.text}
              </div>
            </div>
          )}

          <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
               style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
            
            <div ref={progressRef} className="relative h-1.5 mx-4 mt-4 cursor-pointer group/progress" onClick={handleProgressClick}
                 style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, background: '#3B82F6' }} />
              
              {videoDuration > 0 && comments.map((comment) => (
                <div key={comment.id}
                     className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-yellow-400 hover:scale-150 transition-transform cursor-pointer"
                     style={{ left: `${(comment.timestamp / videoDuration) * 100}%`, transform: 'translate(-50%, -50%)', zIndex: 5 }}
                     title={`${comment.name}: ${comment.text}`}
                     onClick={(e) => { e.stopPropagation(); jumpToTimestamp(comment.timestamp); }} />
              ))}
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5" /></svg>
                )}
              </button>

              <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors text-xs font-medium">-10s</button>
              <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors text-xs font-medium">+10s</button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                  )}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                       className="w-20 h-1 rounded-full appearance-none cursor-pointer"
                       style={{ background: `linear-gradient(to right, #3B82F6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)` }} />
              </div>

              <span className="text-white/70 text-xs font-mono ml-1">{formatTime(currentTime)} / {formatTime(videoDuration)}</span>

              <div className="flex-1" />

              <button onClick={addCommentAtCurrentTime} className="text-white/70 hover:text-yellow-400 transition-colors" title="Add comment (C)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </button>

              <div className="relative">
                <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="text-white/70 hover:text-white transition-colors text-xs font-medium px-2 py-1 rounded"
                        style={{ background: playbackRate !== 1 ? 'rgba(59,130,246,0.3)' : 'transparent' }}>
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 rounded-lg overflow-hidden shadow-2xl"
                       style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button key={speed} onClick={() => handleSpeedChange(speed)}
                              className="block w-full px-4 py-2 text-xs text-left transition-smooth hover:bg-white/10"
                              style={{ color: speed === playbackRate ? '#3B82F6' : 'var(--text-primary)' }}>
                        {speed}x {speed === 1 && '(Normal)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {isFullscreen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{meta?.title || 'Untitled Recording'}</h1>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {meta?.client && (
              <>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg-tertiary)', color: '#3B82F6' }}>{meta.client}</span>
                <span>·</span>
              </>
            )}
            {meta?.createdAt && <span>{formatDate(meta.createdAt)}</span>}
            {meta?.duration !== undefined && meta.duration > 0 && (
              <><span>·</span><span>{formatTime(meta.duration)}</span></>
            )}
            <span>·</span>
            <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1">
            <div className="glass-card p-5 space-y-4 sticky top-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                💬 Add Comment
              </h3>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Your Name</label>
                <input type="text" value={commentName} onChange={(e) => setCommentName(e.target.value)}
                       placeholder="e.g. John"
                       className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-smooth"
                       style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Comment at <span className="font-mono text-blue-400">{formatTime(commentTimestamp)}</span>
                </label>
                <textarea ref={commentInputRef} value={commentText} onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type your feedback..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-smooth resize-none"
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveComment(); }} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addCommentAtCurrentTime}
                        className="px-3 py-2 rounded-lg text-xs transition-smooth"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  📍 Use Current Time
                </button>
                <button onClick={saveComment}
                        disabled={!commentText.trim() || !commentName.trim() || isSubmitting}
                        className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-smooth hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Tip: Press <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>C</kbd> while watching to comment at that moment. <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>Ctrl+Enter</kbd> to post.</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Comments ({comments.length})
            </h3>
            
            {comments.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No comments yet. Be the first to leave feedback!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="glass-card p-4 transition-smooth hover:border-blue-500/20"
                     style={activeComment?.id === comment.id ? { borderColor: 'rgba(59,130,246,0.5)', boxShadow: '0 0 12px rgba(59,130,246,0.15)' } : {}}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                         style={{ background: `hsl(${comment.name.charCodeAt(0) * 7 % 360}, 60%, 50%)` }}>
                      {comment.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{comment.name}</span>
                        <button onClick={() => jumpToTimestamp(comment.timestamp)}
                                className="text-xs font-mono px-1.5 py-0.5 rounded transition-smooth hover:scale-105"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                          {formatTime(comment.timestamp)}
                        </button>
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{formatCommentDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{comment.text}</p>
                    </div>
                    <button onClick={() => deleteComment(comment.id)} className="text-xs shrink-0 opacity-30 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--text-secondary)' }} title="Delete">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 glass-card p-4 flex items-center gap-6 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Shortcuts:</span>
          <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>Space</kbd> Play/Pause</span>
          <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>←</kbd><kbd className="px-1.5 py-0.5 rounded text-[10px] ml-0.5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>→</kbd> Skip 10s</span>
          <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>F</kbd> Fullscreen</span>
          <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>M</kbd> Mute</span>
          <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>C</kbd> Comment</span>
        </div>
      </div>

      <footer className="border-t mt-16 py-6 text-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        Recorded with <a href="/record" className="transition-smooth" style={{ color: '#3B82F6' }}>ScreenCast</a>
      </footer>
    </div>
  );
}