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
