'use client';

import { useEffect, useState } from 'react';
import { supabase, VideoRecord } from '@/lib/supabase';
import { ClickThriveLogo } from '@/components/Logo';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <ClickThriveLogo size="md" />
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm px-4 py-2 rounded-lg transition-smooth"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              My Recordings
            </a>
            <a href="/record" className="text-sm px-4 py-2 rounded-lg text-white font-medium transition-smooth"
              style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
              New Recording
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(0,0,255,0.08)', color: '#4D4DFF', border: '1px solid rgba(0,0,255,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 rec-dot" />
          Powered by Click Thrive Marketing
        </div>

        <h1 className="text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          Show Clients the Results.<br />
          <span style={{ background: 'linear-gradient(135deg, #0000FF, #4D4DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Close Deals Faster.
          </span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Record ad account reviews, walk through campaign performance, and share strategy videos -
          all branded to your agency. Get client feedback with timestamped comments.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <a href="/record" className="px-8 py-4 rounded-xl text-white font-semibold text-lg transition-smooth glow-blue hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0000FF, #0000CC)' }}>
            Start Recording
          </a>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No sign-up required - Works in Chrome and Edge
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '📊', title: 'Ad Account Reviews', desc: 'Walk clients through Meta and Google Ads performance with screen recordings.' },
            { icon: '📷', title: 'Screen + Webcam', desc: 'Show your screen with a webcam bubble overlay. Pause and resume anytime.' },
            { icon: '🔗', title: 'Instant Sharing', desc: 'Get a shareable link the moment you stop recording. Clients watch without downloading.' },
            { icon: '💬', title: 'Timestamped Feedback', desc: 'Clients comment at exact moments in the video. Flag issues, wins, and action items.' },
            { icon: '🎨', title: 'Agency Branded', desc: 'Your logo, your colors. Every video feels like part of your professional workflow.' },
            { icon: '📋', title: 'CTA Buttons', desc: 'Add Book a Call, Approve Budget, or View Report buttons on every video. Coming soon.' },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 space-y-3 transition-smooth hover:border-blue-800/50">
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Click Thrive Marketing. Video collaboration for performance marketers.
        </p>
      </footer>
    </div>
  );
}
