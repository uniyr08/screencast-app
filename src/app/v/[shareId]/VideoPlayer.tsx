'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoMeta {
  title: string;
  client: string;
  duration: number;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

    setLoading(false);
  }, [shareId]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
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
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoDuration));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-10); break;
        case 'ArrowRight': e.preventDefault(); skip(10); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, volume, videoDuration]);

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

          <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
               style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
            
            <div ref={progressRef} className="relative h-1.5 mx-4 mt-4 cursor-pointer group/progress" onClick={handleProgressClick}
                 style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, background: '#3B82F6' }} />
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

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
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
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Shortcuts:</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>Space</kbd> Play/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>←</kbd><kbd className="px-1.5 py-0.5 rounded text-[10px] ml-0.5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>→</kbd> Skip 10s</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>F</kbd> Fullscreen</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>M</kbd> Mute</span>
          </div>
        </div>
      </div>

      <footer className="border-t mt-16 py-6 text-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        Recorded with <a href="/record" className="transition-smooth" style={{ color: '#3B82F6' }}>ScreenCast</a>
      </footer>
    </div>
  );
}