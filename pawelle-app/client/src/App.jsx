import { Navigate, Route, Routes } from 'react-router-dom'
import Button from './components/Button.jsx'
import ErrorNotice from './components/ErrorNotice.jsx'
import Shell, { Logo } from './components/Shell.jsx'
import PetProvider from './hooks/PetProvider.jsx'
import { usePet } from './hooks/usePet.js'
import PetProfile from './pages/PetProfile.jsx'
import Today from './pages/Today.jsx'
import Track from './pages/Track.jsx'
import Welcome from './pages/Welcome.jsx'

function Home() {
  const { pet } = usePet()
  return <Navigate to={pet ? '/today' : '/welcome'} replace />
}

function Gate() {
  const { status, error, reload } = usePet()
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3" role="status">
        <div className="animate-shimmer"><Logo /></div>
        <p className="text-muted">Waking Pawelle up…</p>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <Shell showAvatar={false} nav={false}>
        <div className="mt-10 space-y-4">
          <h1 className="text-2xl font-extrabold">Pawelle is taking a nap</h1>
          <ErrorNotice message={error?.message} onRetry={reload} />
          <p className="text-muted">
            If you started Pawelle yourself, run <code className="rounded bg-line px-1.5 py-0.5">npm run dev</code> in the project folder.
          </p>
          <Button variant="secondary" onClick={reload}>Check again</Button>
        </div>
      </Shell>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/welcome/:step?" element={<Welcome />} />
      <Route path="/today" element={<Today />} />
      <Route path="/track" element={<Track />} />
      <Route path="/pet" element={<PetProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <PetProvider>
      <Gate />
    </PetProvider>
  )
}
