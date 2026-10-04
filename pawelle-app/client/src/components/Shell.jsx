import { Link } from 'react-router-dom'
import { usePet } from '../hooks/usePet.js'
import { photoUrl } from '../api/client.js'
import Avatar from './Avatar.jsx'
import { PawIcon } from './icons.jsx'
import Nav from './Nav.jsx'

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-extrabold text-primary">
      <PawIcon width={26} height={26} />
      Pawelle
    </span>
  )
}

export default function Shell({ children, showAvatar = true, nav = true }) {
  const { pet, version } = usePet()
  return (
    <div className="min-h-screen md:flex">
      {nav && pet && <Nav />}
      <div className={`min-w-0 flex-1 ${nav && pet ? 'pb-24 md:pb-0' : ''}`}>
        <header className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <Link to="/" aria-label="Pawelle home" className="inline-flex min-h-11 items-center">
            <Logo />
          </Link>
          {showAvatar && pet && (
            <Link to="/pet" aria-label={`${pet.name}'s profile`}>
              <Avatar
                name={pet.name}
                size={44}
                src={pet.photos.includes(1) ? photoUrl(pet.id, 1, version) : null}
              />
            </Link>
          )}
        </header>
        <main className="mx-auto max-w-xl px-5 pb-16">{children}</main>
      </div>
    </div>
  )
}
