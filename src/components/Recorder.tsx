'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { ClickThriveLogo } from '@/components/Logo';

type RecordingState = 'idle' | 'preview' | 'recording' | 'paused' | 'stopped' | 'uploading';

interface RecordingOptions {
  screen: boolean;
  webcam: boolean;
  microphone: boolean;
  systemAudio: boolean;
}

export default function Recorder() {
  const [state, setState] = useState<RecordingState>('idle');
  const [options, setOptions] = useState<RecordingOptions>({
    screen: true,
    webcam: true,
    microphone: true,
    systemAudio: true,
  });
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [webcamPosition, setWebcamPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [webcamConnected, setWebcamConnected] = useState(false);
  const [screenConnected, setScreenConnected] = useState(false);

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupStreams = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    webcamStreamRef.current = null;
    setWebcamConnected(false);
    setScreenConnected(false);
  }, []);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];
    setDuration(0);

    try {
      // 1. Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: options.systemAudio,
      });
      screenStreamRef.current = screenStream;

      // Handle screen share stop
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      setScreenConnected(true);

      // 2. Get webcam stream
      let webcamStream: MediaStream | null = null;
      if (options.webcam) {
        try {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, frameRate: 30 },
            audio: false,
          });
          webcamStreamRef.current = webcamStream;
          setWebcamConnected(true);
        } catch (e) {
          console.warn('Webcam not available:', e);
        }
      }

      // 3. Get microphone stream
      let micStream: MediaStream | null = null;
      if (options.microphone) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: false,
          });
        } catch (e) {
          console.warn('Microphone not available:', e);
        }
      }

      // 4. Combine audio tracks
      const audioTracks: MediaStreamTrack[] = [];
      if (micStream) audioTracks.push(...micStream.getAudioTracks());
      if (screenStream.getAudioTracks().length > 0) audioTracks.push(...screenStream.getAudioTracks());

      // 5. Create combined stream
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioTracks,
      ]);

      // 6. Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setState('stopped');
        stopTimer();
        cleanupStreams();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setState('recording');
      startTimer();
    } catch (err: any) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was denied. Please allow screen sharing to record.');
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
      cleanupStreams();
      setState('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setShareLink(null);
    setDuration(0);
    setVideoTitle('');
    setClientName('');
    setState('idle');
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;
    setState('uploading');
    setUploadProgress(0);

    try {
      const shareId = uuidv4().split('-')[0];
      const fileName = `videos/${shareId}.webm`;
      const title = videoTitle || `Recording ${new Date().toLocaleDateString()}`;

      setUploadProgress(20);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, recordedBlob, { contentType: 'video/webm', upsert: false });

      if (uploadError) throw uploadError;
      setUploadProgress(70);

      let thumbnailPath: string | null = null;
      try {
        const thumbBlob = await generateThumbnail(recordedUrl!);
        if (thumbBlob) {
          const thumbName = `thumbnails/${shareId}.jpg`;
          const { error: thumbError } = await supabase.storage
            .from('recordings')
            .upload(thumbName, thumbBlob, { contentType: 'image/jpeg' });
          if (!thumbError) thumbnailPath = thumbName;
        }
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      }
      setUploadProgress(85);

      const { error: dbError } = await supabase.from('videos').insert({
        title,
        file_path: fileName,
        thumbnail_path: thumbnailPath,
        duration,
        file_size: recordedBlob.size,
        share_id: shareId,
        status: 'ready',
        views: 0,
        metadata: { client_name: clientName || null, tags: [] },
      });

      if (dbError) throw dbError;
      setUploadProgress(100);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setShareLink(`${appUrl}/v/${shareId}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      setState('stopped');
    }
  };

  const generateThumbnail = (videoUrl: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.currentTime = 2;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        } else {
          resolve(null);
        }
      };
      video.onerror = () => resolve(null);
    });
  };

  const copyLink = () => {
    if (shareLink) navigator.clipboard.writeText(shareLink);
  };

  // Attach screen stream to video element when recording starts and element mounts
  useEffect(() => {
    if ((state === 'recording' || state === 'paused') && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
      screenVideoRef.current.play().catch(() => {});
    }
  }, [state, screenConnected]);

  // Attach webcam stream to video element when ref and stream are both ready
  useEffect(() => {
    if ((state === 'recording' || state === 'paused') && webcamConnected && webcamVideoRef.current && webcamStreamRef.current) {
      webcamVideoRef.current.srcObject = webcamStreamRef.current;
      webcamVideoRef.current.play().catch(() => {});
    }
  }, [webcamConnected, state]);

  useEffect(() => {
    return () => {
      cleanupStreams();
      stopTimer();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <ClickThriveLogo size="sm" />
          </a>
          <a href="/dashboard" className="text-sm px-4 py-2 rounded-lg transition-smooth" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            My Recordings
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4">&#x2715;</button>
          </div>
        )}

        {/* IDLE STATE */}
        {state === 'idle' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Record Your Screen</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Capture your screen, webcam, and audio. Share with a single link.</p>
            </div>

            <div className="glass-card p-6 max-w-lg mx-auto space-y-5">
              <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Recording Options</h3>
              {[
                { key: 'screen' as const, label: 'Screen', desc: 'Capture your screen or window', icon: '\uD83D\uDDA5\uFE0F', disabled: true },
                { key: 'webcam' as const, label: 'Webcam', desc: 'Show your face in a bubble', icon: '\uD83D\uDCF7' },
                { key: 'microphone' as const, label: 'Microphone', desc: 'Record your voice', icon: '\uD83C\uDF99\uFE0F' },
                { key: 'systemAudio' as const, label: 'Tab Audio', desc: 'Capture audio from browser tab', icon: '\uD83D\uDD0A' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-smooth hover:bg-white/5">
                  <span className="text-xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</div>
                  </div>
                  <input type="checkbox" checked={options[opt.key]}
                    onChange={(e) => setOptions((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                    disabled={opt.disabled} className="w-5 h-5 rounded accent-blue-700" />
                </label>
              ))}
            </div>

            <div className="glass-card p-6 max-w-lg mx-auto space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Video Details (Optional)</h3>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Video Title</label>
                <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Weekly Performance Review" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-smooth"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Client / Account Name</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Nike, Acme Corp" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-smooth"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div className="text-center">
              <button onClick={startRecording}
                className="px-8 py-4 rounded-xl text-white font-semibold text-lg transition-smooth glow-blue hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
                <span className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                  Start Recording
                </span>
              </button>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Works best in Chrome or Edge. No time limit.</p>
            </div>
          </div>
        )}

        {/* RECORDING / PAUSED STATE */}
        {(state === 'recording' || state === 'paused') && (
          <div className="space-y-6">
            <div className={`glass-card p-4 flex items-center justify-between ${state === 'recording' ? 'glow-red' : ''}`}
              style={state === 'recording' ? { borderColor: 'rgba(239,68,68,0.4)' } : {}}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 rec-dot' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-semibold" style={{ color: state === 'recording' ? '#EF4444' : '#F59E0B' }}>
                    {state === 'recording' ? 'RECORDING' : 'PAUSED'}
                  </span>
                </div>
                <span className="font-mono text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(duration)}</span>
              </div>
              <div className="flex items-center gap-3">
                {state === 'recording' ? (
                  <button onClick={pauseRecording} className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    &#x23F8; Pause
                  </button>
                ) : (
                  <button onClick={resumeRecording} className="px-4 py-2 rounded-lg text-sm font-medium transition-smooth"
                    style={{ background: 'var(--bg-tertiary)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                    &#x25B6; Resume
                  </button>
                )}
                <button onClick={stopRecording} className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-smooth"
                  style={{ background: '#EF4444' }}>
                  &#x23F9; Stop
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', aspectRatio: '16/9' }}>
              <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
              
              {/* Webcam overlay - uses state variable instead of ref */}
              {options.webcam && webcamConnected && (
                <div className={`absolute ${
                  webcamPosition === 'bottom-right' ? 'bottom-4 right-4' :
                  webcamPosition === 'bottom-left' ? 'bottom-4 left-4' :
                  webcamPosition === 'top-right' ? 'top-4 right-4' : 'top-4 left-4'
                } w-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-pointer`}
                  style={{ aspectRatio: '4/3' }}
                  onClick={() => setWebcamPosition(prev =>
                    prev === 'bottom-right' ? 'bottom-left' :
                    prev === 'bottom-left' ? 'top-left' :
                    prev === 'top-left' ? 'top-right' : 'bottom-right'
                  )}>
                  <video ref={webcamVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Click the webcam to move it. Your recording has no time limit.
            </p>
          </div>
        )}

        {/* STOPPED STATE */}
        {state === 'stopped' && !shareLink && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Recording Complete</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{formatDuration(duration)} &#x00B7; {recordedBlob ? formatSize(recordedBlob.size) : ''}</p>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <video ref={previewVideoRef} src={recordedUrl || undefined} controls className="w-full" style={{ maxHeight: '500px' }} />
            </div>

            <div className="glass-card p-6 space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Video Title</label>
                <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Weekly Performance Review" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-smooth"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Client / Account Name</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Nike, Acme Corp" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-smooth"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={discardRecording} className="px-6 py-3 rounded-lg text-sm font-medium transition-smooth"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                &#x1F5D1; Discard
              </button>
              <button onClick={uploadVideo} className="px-8 py-3 rounded-lg text-sm font-semibold text-white transition-smooth glow-blue hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
                &#x2601;&#xFE0F; Upload &amp; Get Link
              </button>
              {recordedUrl && (
                <a href={recordedUrl} download={`${videoTitle || 'recording'}.webm`}
                  className="px-6 py-3 rounded-lg text-sm font-medium transition-smooth"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  &#x2B07; Download
                </a>
              )}
            </div>
          </div>
        )}

        {/* UPLOADING STATE */}
        {state === 'uploading' && (
          <div className="space-y-8 text-center py-16">
            <div className="space-y-3">
              <div className="text-4xl">&#x2601;&#xFE0F;</div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Uploading Your Recording...</h2>
              <p style={{ color: 'var(--text-secondary)' }}>This will just take a moment</p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #0000FF, #4D4DFF)' }} />
              </div>
              <p className="text-sm mt-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* SHARE LINK STATE */}
        {shareLink && (
          <div className="space-y-8 text-center py-12">
            <div className="space-y-3">
              <div className="text-5xl">&#x1F389;</div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Recording is Ready!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Share this link with anyone to let them watch</p>
            </div>

            <div className="glass-card p-6 max-w-lg mx-auto space-y-4">
              <div className="flex items-center gap-2">
                <input type="text" value={shareLink} readOnly
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                <button onClick={copyLink} className="px-5 py-3 rounded-lg text-sm font-semibold text-white transition-smooth hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
                  &#x1F4CB; Copy
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 pt-2">
                <a href={shareLink} target="_blank" className="text-sm transition-smooth" style={{ color: '#0000FF' }}>
                  Open in new tab &#x2192;
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={discardRecording} className="px-6 py-3 rounded-lg text-sm font-medium transition-smooth"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                &#x1F3AC; New Recording
              </button>
              <a href="/dashboard" className="px-6 py-3 rounded-lg text-sm font-medium transition-smooth"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                &#x1F4CA; Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}