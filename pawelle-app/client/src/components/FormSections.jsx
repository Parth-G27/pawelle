import { COMMON_ALLERGIES, COMMON_CONDITIONS, BREEDS } from '../lib/breeds.js'
import { LIMITS } from '../lib/limits.js'
import { todayIso } from '../lib/age.js'
import {
  ACTIVITY_OPTIONS,
  DIET_OPTIONS,
  NEUTERED_OPTIONS,
  SEX_OPTIONS,
} from '../lib/labels.js'
import ChipGroup, { Chip } from './ChipGroup.jsx'
import { Group, TextField } from './Field.jsx'
import ListPicker from './ListPicker.jsx'

const nameOf = (form) => form.name.trim() || 'your cat'

export function AboutFields({ form, set, errors }) {
  const n = nameOf(form)
  return (
    <div className="space-y-6">
      <TextField
        label="What's your cat's name?"
        value={form.name}
        maxLength={LIMITS.nameMax + 20}
        autoComplete="off"
        placeholder="e.g. Pinky"
        error={errors.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <Group legend={`Is ${n} a girl or a boy?`} optional>
        <ChipGroup options={SEX_OPTIONS} value={form.sex} onChange={(v) => set({ sex: v })} />
      </Group>
      <Group legend={`Is ${n} neutered or spayed?`} optional>
        <ChipGroup options={NEUTERED_OPTIONS} value={form.neutered} onChange={(v) => set({ neutered: v })} />
      </Group>
    </div>
  )
}

export function BasicsFields({ form, set, errors }) {
  const n = nameOf(form)
  return (
    <div className="space-y-6">
      <Group legend={`How old is ${n}?`} optional error={errors.birthdate} helper="Roughly is fine.">
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip selected={form.ageMode === 'approx'} onClick={() => set({ ageMode: 'approx' })}>
            About how old
          </Chip>
          <Chip selected={form.ageMode === 'date'} onClick={() => set({ ageMode: 'date' })}>
            I know the birthday
          </Chip>
        </div>
        {form.ageMode === 'date' ? (
          <input
            type="date"
            aria-label="Birthday"
            value={form.birthdate}
            max={todayIso()}
            onChange={(e) => set({ birthdate: e.target.value })}
            className="min-h-12 w-full rounded-2xl border-2 border-line bg-surface px-4 text-base focus:border-primary"
          />
        ) : (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="30"
                aria-label="Years"
                placeholder="0"
                value={form.ageYears}
                onChange={(e) => set({ ageYears: e.target.value })}
                className="min-h-12 w-20 rounded-2xl border-2 border-line bg-surface px-3 text-base focus:border-primary"
              />
              years
            </label>
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="11"
                aria-label="Months"
                placeholder="0"
                value={form.ageMonths}
                onChange={(e) => set({ ageMonths: e.target.value })}
                className="min-h-12 w-20 rounded-2xl border-2 border-line bg-surface px-3 text-base focus:border-primary"
              />
              months
            </label>
          </div>
        )}
      </Group>

      <div>
        <TextField
          label={`What breed is ${n}?`}
          optional
          list="cat-breeds"
          value={form.breed}
          maxLength={60}
          placeholder="Start typing, or pick one"
          autoComplete="off"
          onChange={(e) => set({ breed: e.target.value })}
        />
        <datalist id="cat-breeds">
          {BREEDS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Mixed / domestic', 'Not sure'].map((b) => (
            <Chip key={b} selected={form.breed === b} onClick={() => set({ breed: form.breed === b ? '' : b })}>
              {b}
            </Chip>
          ))}
        </div>
      </div>

      <TextField
        label={`How much does ${n} weigh? (kg)`}
        optional
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        placeholder="e.g. 4.2"
        helper="Roughly is fine."
        error={errors.weight}
        value={form.weight}
        onChange={(e) => set({ weight: e.target.value })}
      />

      <Group legend={`How active is ${n}?`}>
        <ChipGroup
          options={ACTIVITY_OPTIONS}
          value={form.activity_level}
          onChange={(v) => set({ activity_level: v ?? 'balanced' })}
        />
      </Group>

      <Group legend={`What does ${n} usually eat?`} optional>
        <ChipGroup options={DIET_OPTIONS} value={form.diet_type} onChange={(v) => set({ diet_type: v })} />
      </Group>
    </div>
  )
}

export function HealthFields({ form, set, errors }) {
  const n = nameOf(form)
  return (
    <div className="space-y-6">
      <Group legend={`Does ${n} have any food allergies?`} optional helper="Pawelle will never suggest these.">
        <ListPicker
          value={form.allergies}
          onChange={(v) => set({ allergies: v })}
          suggestions={COMMON_ALLERGIES}
          noneLabel="No known allergies"
          addLabel="Add another, e.g. turkey"
          inputLabel="allergy"
        />
      </Group>
      <Group legend={`Any health conditions for ${n}?`} optional>
        <ListPicker
          value={form.conditions}
          onChange={(v) => set({ conditions: v })}
          suggestions={COMMON_CONDITIONS}
          noneLabel="None that we know of"
          addLabel="Add another condition"
          inputLabel="condition"
        />
      </Group>
      <TextField
        label="Anything else we should know?"
        optional
        multiline
        maxLength={LIMITS.notesMax + 50}
        placeholder="Habits, likes, dislikes…"
        helper={`${form.notes.length}/${LIMITS.notesMax}`}
        error={errors.notes}
        value={form.notes}
        onChange={(e) => set({ notes: e.target.value })}
      />
    </div>
  )
}
