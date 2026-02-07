export function ClickThriveLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    sm: { icon: 20, text: 'text-sm', gap: 'gap-2' },
    md: { icon: 28, text: 'text-lg', gap: 'gap-2.5' },
    lg: { icon: 40, text: 'text-2xl', gap: 'gap-3' },
  }[size];

  return (
    <div className={`flex items-center ${config.gap}`}>
      <svg width={config.icon} height={config.icon} viewBox="0 0 40 40" fill="none">
        <path
          d="M8 4C8 2.5 9 1 11 1h10c1.5 0 3 0.8 3.8 2l12 18c1.5 2.3 1.5 5.3 0 7.5l-4 6C31.5 36.5 29.5 38 27 38H11c-2 0-3-1.5-3-3V4z"
          fill="#0000FF"
          rx="4"
        />
        <path
          d="M12 12l14 10-14 10V12z"
          fill="white"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`${config.text} font-extrabold tracking-tight`} style={{ color: 'var(--text-primary)' }}>
          CLICK THRIVE
        </span>
        <span className={`${size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'} font-semibold tracking-widest`} style={{ color: '#0000FF' }}>
          MARKETING
        </span>
      </div>
    </div>
  );
}

export function ClickThriveIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M8 4C8 2.5 9 1 11 1h10c1.5 0 3 0.8 3.8 2l12 18c1.5 2.3 1.5 5.3 0 7.5l-4 6C31.5 36.5 29.5 38 27 38H11c-2 0-3-1.5-3-3V4z"
        fill="#0000FF"
        rx="4"
      />
      <path
        d="M12 12l14 10-14 10V12z"
        fill="white"
      />
    </svg>
  );
}