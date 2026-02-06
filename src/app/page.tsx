'use client';

import { useEffect, useState } from 'react';
import { supabase, VideoRecord } from '@/lib/supabase';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
              </svg>
            </div>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ScreenCast</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm px-4 py-2 rounded-lg transition-smooth"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              My Recordings
            </a>
            <a href="/record" className="text-sm px-4 py-2 rounded-lg text-white font-medium transition-smooth"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              New Recording
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 rec-dot" />
          Free · No Limits · No Watermark
        </div>

        <h1 className="text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          Record Your Screen.<br />
          <span style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Share in Seconds.
          </span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Screen recording built for performance marketers. Record account reviews, share with clients, 
          get AI-powered insights — all without time limits or watermarks.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <a href="/record" className="px-8 py-4 rounded-xl text-white font-semibold text-lg transition-smooth glow-blue hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
            Start Recording — It&apos;s Free
          </a>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No sign-up required · Works in Chrome & Edge
        </p>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: '🎬',
              title: 'Unlimited Recording',
              desc: 'No 5-minute caps. Record as long as you need — walkthroughs, reviews, demos.',
            },
            {
              icon: '📷',
              title: 'Screen + Webcam',
              desc: 'Show your screen with a webcam bubble overlay. Pause and resume anytime.',
            },
            {
              icon: '🔗',
              title: 'Instant Sharing',
              desc: 'Get a shareable link the moment you stop recording. No downloads for viewers.',
            },
            {
              icon: '💬',
              title: 'Timestamped Comments',
              desc: 'Clients can comment at exact moments in the video. Coming soon.',
            },
            {
              icon: '🤖',
              title: 'AI Summaries',
              desc: 'Auto-generated transcription, summaries, and action items. Coming soon.',
            },
            {
              icon: '📊',
              title: 'Viewer Analytics',
              desc: 'Know who watched, how long, and where they dropped off. Coming soon.',
            },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 space-y-3 transition-smooth hover:border-blue-500/30">
              <div className="text-2xl">{feature.icon}</div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Built for performance marketers. Open source & free.
        </p>
      </footer>
    </div>
  );
}
