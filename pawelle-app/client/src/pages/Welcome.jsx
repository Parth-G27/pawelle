import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { createPet, putPhoto } from '../api/client.js'
import { usePet } from '../hooks/usePet.js'
import { clearDraft, loadDraft, saveDraft } from '../lib/draft.js'
import { dataUrlToBlob } from '../lib/image.js'
import { emptyForm, toPayload, validate } from '../lib/petForm.js'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import { Group } from '../components/Field.jsx'
import { AboutFields, BasicsFields, HealthFields } from '../components/FormSections.jsx'
import { ArrowLeftIcon } from '../components/icons.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import Shell from '../components/Shell.jsx'
import StepIndicator from '../components/StepIndicator.jsx'

const FIELD_STEP = { name: 1, weight: 2, birthdate: 2, notes: 3 }
const SERVER_FIELD = { weight_kg: 'weight' }

const COPY = {
  1: { title: 'Let’s meet your cat', sub: 'Just a name to start. Everything else is optional.' },
  2: { title: 'The basics', sub: 'A few quick taps help Pawelle tailor its tips.' },
  3: { title: 'Health', sub: 'Skip this if you like. You can add it any time.' },
}

export default function Welcome() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const { pet, reload } = usePet()

  const [init] = useState(() => loadDraft())
  const [form, setForm] = useState(() => init?.form ?? emptyForm())
  const [photos, setPhotos] = useState(() => init?.photos ?? [])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState(null)
  const [done, setDone] = useState(null)
  const createdRef = useRef(null)
  const uploadedRef = useRef(0)

  const step = Math.min(3, Math.max(1, Number(stepParam) || 1))

  useEffect(() => {
    if (!done) saveDraft({ form, photos, step })
  }, [form, photos, step, done])

  useEffect(() => {
    if (!done) return undefined
    const t = setTimeout(() => navigate('/today', { replace: true }), 1700)
    return () => clearTimeout(t)
  }, [done, navigate])

  if (pet && !createdRef.current) return <Navigate to="/today" replace />
  if (!stepParam) return <Navigate to={`/welcome/${init?.step ?? 1}`} replace />
  if (step > 1 && !form.name.trim()) return <Navigate to="/welcome/1" replace />

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch)) {
        delete next[key]
        if (key === 'weight') delete next.weight
        if (key.startsWith('age') || key === 'birthdate') delete next.birthdate
      }
      return next
    })
  }
  const go = (n) => navigate(`/welcome/${n}`)
  const n = form.name.trim() || 'your cat'

  const stepErrors = (forStep) => {
    const all = validate(form)
    return Object.fromEntries(Object.entries(all).filter(([k]) => FIELD_STEP[k] === forStep))
  }

  const next = () => {
    const errs = stepErrors(step)
    setErrors(errs)
    if (Object.keys(errs).length === 0) go(step + 1)
  }

  async function finish() {
    const all = validate(form)
    if (Object.keys(all).length) {
      setErrors(all)
      go(Math.min(...Object.keys(all).map((k) => FIELD_STEP[k] ?? 3)))
      return
    }
    setSaving(true)
    setFailure(null)
    try {
      if (!createdRef.current) {
        try {
          createdRef.current = await createPet(toPayload(form))
        } catch (e) {
          if (e.fields) {
            const mapped = Object.fromEntries(
              Object.entries(e.fields).map(([k, v]) => [SERVER_FIELD[k] ?? k, v]),
            )
            setErrors(mapped)
            go(Math.min(...Object.keys(mapped).map((k) => FIELD_STEP[k] ?? 3)))
            setSaving(false)
            return
          }
          throw e
        }
      }
      while (uploadedRef.current < photos.length) {
        const blob = await dataUrlToBlob(photos[uploadedRef.current].src)
        await putPhoto(createdRef.current.id, uploadedRef.current + 1, blob)
        uploadedRef.current += 1
      }
      await complete()
    } catch (e) {
      setFailure(e)
    } finally {
      setSaving(false)
    }
  }

  async function complete() {
    clearDraft()
    await reload()
    setDone({ name: form.name.trim(), src: photos[0]?.src ?? null })
  }

  if (done) {
    return (
      <Shell showAvatar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-rise">
          <div className="animate-pop">
            <Avatar name={done.name} src={done.src} size={128} />
          </div>
          <h1 className="text-3xl font-extrabold">Welcome, {done.name}!</h1>
          <p className="text-muted">Pawelle is ready to help look after {done.name}.</p>
        </div>
      </Shell>
    )
  }

  const photoError =
    failure && createdRef.current && uploadedRef.current < photos.length
      ? 'Your cat’s profile is saved, but a photo didn’t upload.'
      : null

  return (
    <Shell showAvatar={false}>
      <div className="animate-rise">
        <div className="flex items-center justify-between">
          <StepNav step={step} onBack={() => go(step - 1)} />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold">{COPY[step].title}</h1>
        <p className="mt-1 text-muted">{COPY[step].sub}</p>

        <form
          className="mt-6 space-y-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (step < 3) next()
            else finish()
          }}
        >
          {step === 1 && (
            <>
              <AboutFields form={form} set={set} errors={errors} />
              <Group legend={`A photo of ${n}`} optional helper="Up to 2 photos. They stay on this device.">
                <PhotoPicker
                  name={form.name.trim()}
                  photos={photos}
                  onAdd={({ dataUrl }) => setPhotos((p) => [...p, { src: dataUrl }])}
                  onReplace={(i, { dataUrl }) => setPhotos((p) => p.map((x, j) => (j === i ? { src: dataUrl } : x)))}
                  onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))}
                />
              </Group>
            </>
          )}
          {step === 2 && <BasicsFields form={form} set={set} errors={errors} />}
          {step === 3 && <HealthFields form={form} set={set} errors={errors} />}

          {failure && (
            <ErrorNotice
              message={photoError ?? failure.message}
              onRetry={finish}
              retryLabel={photoError ? 'Try the photo again' : 'Try again'}
            />
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving || (step === 1 && !form.name.trim())}
              className="w-full"
            >
              {step < 3 ? 'Next' : saving ? 'Saving…' : `Meet ${form.name.trim()}`}
            </Button>
            {step > 1 && !photoError && (
              <Button variant="text" onClick={step === 2 ? () => go(3) : finish} disabled={saving}>
                Skip for now
              </Button>
            )}
            {photoError && (
              <Button variant="text" onClick={complete} disabled={saving}>
                Continue without the photo
              </Button>
            )}
          </div>
        </form>
      </div>
    </Shell>
  )
}

function StepNav({ step, onBack }) {
  return (
    <>
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-muted hover:text-ink"
        >
          <ArrowLeftIcon /> Back
        </button>
      ) : (
        <span />
      )}
      <StepIndicator step={step} />
    </>
  )
}
