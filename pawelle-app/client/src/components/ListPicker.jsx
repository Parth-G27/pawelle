import { useState } from 'react'
import { LIMITS } from '../lib/limits.js'
import { Chip } from './ChipGroup.jsx'
import { PlusIcon } from './icons.jsx'

// value: null = not answered, [] = "none", otherwise a list of strings.
export default function ListPicker({ value, onChange, suggestions, noneLabel, addLabel, inputLabel }) {
  const [draft, setDraft] = useState('')
  const list = value ?? []
  const has = (item) => list.some((x) => x.toLowerCase() === item.toLowerCase())
  const isNone = value !== null && value.length === 0

  const set = (next) => onChange(next.length === 0 ? null : next)
  const toggle = (item) => set(has(item) ? list.filter((x) => x.toLowerCase() !== item.toLowerCase()) : [...list, item])
  const add = () => {
    const item = draft.trim().replace(/\s+/g, ' ').slice(0, LIMITS.listItemMax)
    if (item && !has(item)) set([...list, item])
    setDraft('')
  }
  const custom = list.filter((x) => !suggestions.some((s) => s.toLowerCase() === x.toLowerCase()))

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Chip selected={isNone} onClick={() => onChange(isNone ? null : [])}>
          {noneLabel}
        </Chip>
        {suggestions.map((s) => (
          <Chip key={s} selected={has(s)} onClick={() => toggle(s)}>
            {s}
          </Chip>
        ))}
        {custom.map((s) => (
          <Chip key={s} selected onClick={() => toggle(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          aria-label={inputLabel}
          value={draft}
          maxLength={LIMITS.listItemMax}
          placeholder={addLabel}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="min-h-12 w-full rounded-2xl border-2 border-line bg-surface px-4 text-base placeholder:text-muted focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border-2 border-line bg-surface font-semibold hover:border-primary disabled:text-muted"
          aria-label={`Add ${inputLabel}`}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}
