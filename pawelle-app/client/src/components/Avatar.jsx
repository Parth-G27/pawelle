export default function Avatar({ src, name, size = 48, className = '' }) {
  const style = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={`Photo of ${name}`}
        style={style}
        className={`shrink-0 rounded-full border-2 border-surface object-cover shadow-card ${className}`}
      />
    )
  }
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary ${className}`}
      role="img"
      aria-label={`${name || 'Your cat'} (no photo yet)`}
    >
      <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62} fill="currentColor" aria-hidden="true">
        <path d="M8 6l9 7a17 17 0 0114 0l9-7v18a16 16 0 01-32 0z" opacity=".9" />
        <circle cx="18" cy="26" r="2.4" fill="#fff" />
        <circle cx="30" cy="26" r="2.4" fill="#fff" />
        <path d="M21 32h6l-3 3.2z" fill="#fff" />
      </svg>
    </span>
  )
}
