import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { deletePet, deletePhoto, photoUrl, putPhoto, updatePet } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import CompletenessRing from '../components/CompletenessRing.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import { AboutFields, BasicsFields, HealthFields } from '../components/FormSections.jsx'
import { ArrowLeftIcon } from '../components/icons.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import Shell from '../components/Shell.jsx'
import { usePet } from '../hooks/usePet.js'
import { describeAge, birthdateToApprox } from '../lib/age.js'
import { clearDraft } from '../lib/draft.js'
import { ACTIVITY_OPTIONS, DIET_OPTIONS, NEUTERED_OPTIONS, SEX_OPTIONS, labelFor } from '../lib/labels.js'
import { fromPet, toPayload, validate } from '../lib/petForm.js'

const SECTION_OF = {
  sex: 'about', neutered: 'about',
  weight_kg: 'basics', birthdate: 'basics', breed: 'basics', diet_type: 'basics',
  allergies: 'health', conditions: 'health', notes: 'health',
  photo: 'photos',
}
const SERVER_FIELD = { weight_kg: 'weight' }

const listText = (v) => (v === null ? 'Not answered yet' : v.length === 0 ? 'None' : v.join(', '))

export default function PetProfile() {
  const { pet, version, reload } = usePet()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!pet) return <Navigate to="/welcome" replace />

  const n = pet.name
  const src = (slot) => photoUrl(pet.id, slot, version)

  const startEdit = (section) => {
    setForm(fromPet(pet))
    setErrors({})
    setFailure(null)
    setEditing(section)
  }
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors({})
  }

  async function save() {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setFailure(null)
    try {
      await updatePet(pet.id, toPayload(form))
      await reload()
      setEditing(null)
    } catch (e) {
      if (e.fields) {
        setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [SERVER_FIELD[k] ?? k, v])))
      }
      setFailure(e)
    } finally {
      setSaving(false)
    }
  }

  async function photoAction(action) {
    setFailure(null)
    try {
      await action()
      await reload()
    } catch (e) {
      setFailure(e)
      throw e
    }
  }

  async function remove() {
    setSaving(true)
    try {
      await deletePet(pet.id)
      clearDraft()
      await reload()
      navigate('/', { replace: true })
    } catch (e) {
      setConfirming(false)
      setFailure(e)
    } finally {
      setSaving(false)
    }
  }

  const sectionProps = (key, title, view, fields) => (
    <Section
      title={title}
      editing={editing === key}
      onEdit={() => startEdit(key)}
      onCancel={() => setEditing(null)}
      onSave={save}
      saving={saving}
      failure={editing === key ? failure : null}
      onRetry={save}
      view={view}
    >
      {editing === key && fields}
    </Section>
  )

  const approx = pet.birthdate ? describeAge(birthdateToApprox(pet.birthdate)) : null

  return (
    <Shell>
      <div className="animate-rise space-y-5">
        <Link to="/today" className="inline-flex min-h-11 items-center gap-1 font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon /> Back
        </Link>

        <section className="flex items-center gap-4 rounded-card bg-surface p-5 shadow-card">
          <Avatar name={n} size={88} src={pet.photos.includes(1) ? src(1) : null} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-extrabold">{n}</h1>
            <p className="text-muted">Pawelle knows {n} {pet.completeness}%</p>
          </div>
          <CompletenessRing percent={pet.completeness} />
        </section>

        {pet.next_suggestion && editing === null && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-sage-soft p-4">
            <p className="font-semibold text-ink">{pet.next_suggestion.prompt}</p>
            <Button variant="secondary" className="min-h-11" onClick={() => startEdit(SECTION_OF[pet.next_suggestion.field])}>
              Add it
            </Button>
          </section>
        )}

        {sectionProps(
          'about',
          'About',
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <Row label="Name" value={n} />
            <Row label="Girl or boy" value={labelFor(SEX_OPTIONS, pet.sex)} />
            <Row label="Neutered or spayed" value={labelFor(NEUTERED_OPTIONS, pet.neutered)} />
          </dl>,
          form && <AboutFields form={form} set={set} errors={errors} />,
        )}

        {sectionProps(
          'basics',
          'The basics',
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <Row label="Age" value={approx ? `${pet.birthdate_estimated ? 'About ' : ''}${approx}` : null} />
            <Row label="Breed" value={pet.breed} />
            <Row label="Weight" value={pet.weight_kg == null ? null : `${pet.weight_kg} kg`} />
            <Row label="Activity" value={labelFor(ACTIVITY_OPTIONS, pet.activity_level)} />
            <Row label="Food" value={labelFor(DIET_OPTIONS, pet.diet_type)} />
          </dl>,
          form && <BasicsFields form={form} set={set} errors={errors} />,
        )}

        {sectionProps(
          'health',
          'Health',
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <Row label="Allergies" value={listText(pet.allergies)} />
            <Row label="Conditions" value={listText(pet.conditions)} />
            <Row label="Notes" value={pet.notes} />
          </dl>,
          form && <HealthFields form={form} set={set} errors={errors} />,
        )}

        <section className="rounded-card bg-surface p-5 shadow-card">
          <h2 className="text-lg font-extrabold">Photos</h2>
          <p className="mb-3 text-sm text-muted">Up to 2 photos. They stay on this device.</p>
          <PhotoPicker
            name={n}
            photos={pet.photos.map((slot) => ({ src: src(slot) }))}
            onAdd={({ blob }) => photoAction(() => putPhoto(pet.id, pet.photos.length + 1, blob))}
            onReplace={(i, { blob }) => photoAction(() => putPhoto(pet.id, pet.photos[i], blob))}
            onRemove={(i) => photoAction(() => deletePhoto(pet.id, pet.photos[i])).catch(() => {})}
          />
          {editing === null && failure && <div className="mt-3"><ErrorNotice message={failure.message} /></div>}
        </section>

        <section className="rounded-card border-2 border-line p-5">
          <h2 className="text-lg font-extrabold">Remove {n}'s profile</h2>
          <p className="mt-1 text-sm text-muted">This deletes {n}'s details and photos from this device.</p>
          <Button variant="secondary" className="mt-3" onClick={() => setConfirming(true)}>
            Delete {n}'s profile
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${n}'s profile?`}
        confirmLabel={`Yes, delete ${n}`}
        onCancel={() => setConfirming(false)}
        onConfirm={remove}
        busy={saving}
      >
        <p>This removes everything Pawelle knows about {n}, including photos. It can't be undone.</p>
      </ConfirmDialog>
    </Shell>
  )
}

function Row({ label, value }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value || <span className="font-normal text-muted">Not added yet</span>}</dd>
    </>
  )
}

function Section({ title, editing, onEdit, onCancel, onSave, saving, failure, onRetry, view, children }) {
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 px-2 font-bold text-primary underline underline-offset-4"
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
          className="space-y-5"
        >
          {children}
          {failure && !failure.fields && <ErrorNotice message={failure.message} onRetry={onRetry} />}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="text" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        view
      )}
    </section>
  )
}
