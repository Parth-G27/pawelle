const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const CloseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const CameraIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)
export const ArrowLeftIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)
export const AlertIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </svg>
)
export const PawIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <ellipse cx="6.5" cy="10" rx="2" ry="2.6" />
    <ellipse cx="17.5" cy="10" rx="2" ry="2.6" />
    <ellipse cx="10" cy="5.8" rx="2" ry="2.6" />
    <ellipse cx="14" cy="5.8" rx="2" ry="2.6" />
    <path d="M12 11c-3 0-5.5 2.7-5.5 5.2 0 1.9 1.5 2.8 3 2.8 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.5 0 3-.9 3-2.8C17.5 13.700 15 11 12 11z" />
  </svg>
)
// The AI mark: used on every button where the model gets involved.
export const SparkleIcon = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true" {...p}>
    <path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8z" />
    <path d="M18 12l.9 2.6 2.6.9-2.6.9L18 19l-.9-2.6-2.6-.9 2.6-.9z" />
    <path d="M6 17l.6 1.7 1.7.6-1.7.6L6 21.6l-.6-1.7-1.7-.6 1.7-.6z" opacity=".8" />
  </svg>
)
export const HomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" />
  </svg>
)
export const PlanIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 4h8l2 2v14H6V6z" />
    <path d="M9 11h6M9 15h4" />
  </svg>
)
export const CopyIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 012-2h9" />
  </svg>
)
export const ChevronIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const TrackIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
  </svg>
)
