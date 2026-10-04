import { NavLink } from 'react-router-dom'
import { HomeIcon, TrackIcon } from './icons.jsx'

const ITEMS = [
  { to: '/today', label: 'Today', Icon: HomeIcon },
  { to: '/track', label: 'Track', Icon: TrackIcon },
]

// Bottom bar on phones, left rail from md up. Only tabs that exist are shown.
export default function Nav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:sticky md:top-0 md:h-screen md:w-44 md:shrink-0 md:flex-col md:gap-1 md:self-start md:border-r md:border-t-0 md:p-3 md:pt-6"
    >
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-sm font-bold md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-full md:px-4 ${
              isActive ? 'text-primary-dark md:bg-primary-soft' : 'text-muted hover:text-ink'
            }`
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
