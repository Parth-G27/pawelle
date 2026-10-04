import { useState } from 'react'
import {
  APPETITES, ENERGIES, LITTERS, MOODS, NOTE_MAX, PLAYS, USUAL,
  answerPills, emptyCheckin, fromCheckin, isAnswered, toPayload,
} from '../lib/checkin.js'
import Button from './Button.jsx'
import ChipGroup from './ChipGroup.jsx'
import ErrorNotice from './ErrorNotice.jsx'
import { Group, TextField } from './Field.jsx'
import HeadsUp from './HeadsUp.jsx'
import { PawIcon } from './icons.jsx'

// Form when there is no check-in for today (or while changing it); a summary otherwise.
// Give it key={today} so it resets by itself when the date rolls over.
export default function CheckInCard({ name, today, entry, onSave, startEditing = false }) {
  const [form, setForm] = useState(() => (entry ? fromCheckin(entry) : emptyCheckin()))
  const [editing, setEditing] = useState(startEditing)
  const [justSaved, setJustSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const showForm = !entry || editing

  async function save() {
    if (!isAnswered(form)) return
    setSaving(true)
    setFailure(null)
    try {
      await onSave(today, toPayload(form))
      setEditing(false)
      setJustSaved(true)
    } catch (e) {
      setFailure(e)
    } finally {
      setSaving(false)
    }
  }

  if (!showForm) {
    return (
      <section className="rounded-card bg-surface p-5 shadow-card animate-rise" aria-labelledby="checkin-title">
        <div className="flex items-center gap-3">
          {justSaved && (
            <span className="animate-pop text-sage" aria-hidden="true">
              <PawIcon width={32} height={32} />
            </span>
          )}
          <h2 id="checkin-title" className="text-xl font-extrabold">
            {justSaved ? `Thanks for checking in on ${name}` : "Today's check-in"}
          </h2>
        </div>
        {answerPills(entry).length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {answerPills(entry).map((p) => (
              <li key={p.key} className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-sm font-semibold">
                <span aria-hidden="true">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        )}
        {entry.note && <p className="mt-2 whitespace-pre-wrap text-muted">{entry.note}</p>}
        {entry.flags.length > 0 && (
          <div className="mt-4">
            <HeadsUp flags={entry.flags} />
          </div>
        )}
        <Button
          variant="secondary"
          className="mt-4 min-h-11"
          onClick={() => {
            setForm(fromCheckin(entry))
            setJustSaved(false)
            setEditing(true)
          }}
        >
          Change
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-card bg-surface p-5 shadow-card animate-rise" aria-labelledby="checkin-title">
      <h2 id="checkin-title" className="text-xl font-extrabold">
        How's {name} today?
      </h2>
      <p className="mt-1 text-muted">Tap what fits. Skip anything you like.</p>

      <Button variant="secondary" className="mt-4 w-full" onClick={() => set(USUAL)}>
        {name}'s just like usual
      </Button>

      <form
        noValidate
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Group legend="Mood">
          <ChipGroup options={MOODS} value={form.mood} onChange={(v) => set({ mood: v })} />
        </Group>
        <Group legend="Appetite">
          <ChipGroup options={APPETITES} value={form.appetite} onChange={(v) => set({ appetite: v })} />
        </Group>
        <Group legend="Energy">
          <ChipGroup options={ENERGIES} value={form.energy} onChange={(v) => set({ energy: v })} />
        </Group>
        <Group legend={`Did ${name} play today?`}>
          <ChipGroup options={PLAYS} value={form.play_minutes} onChange={(v) => set({ play_minutes: v })} />
        </Group>
        <Group legend="Litter box">
          <ChipGroup options={LITTERS} value={form.litter} onChange={(v) => set({ litter: v })} />
        </Group>
        <TextField
          label="Anything to add?"
          optional
          multiline
          maxLength={NOTE_MAX + 50}
          placeholder="e.g. Ate slowly this morning"
          helper={`${form.note.length}/${NOTE_MAX}`}
          error={form.note.length > NOTE_MAX ? `Notes can be up to ${NOTE_MAX} characters.` : undefined}
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
        />

        {failure && <ErrorNotice message={failure.message} onRetry={save} />}

        <div className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={saving || !isAnswered(form) || form.note.length > NOTE_MAX}>
            {saving ? 'Saving…' : 'Save check-in'}
          </Button>
          {entry && (
            <Button variant="text" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </section>
  )
}
