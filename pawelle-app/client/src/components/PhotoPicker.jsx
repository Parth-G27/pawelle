import { useRef, useState } from 'react'
import { LIMITS } from '../lib/limits.js'
import { PhotoError, processPhoto } from '../lib/image.js'
import { CameraIcon, PlusIcon } from './icons.jsx'

// photos: [{ src }] (max 2). Handlers receive the processed { blob, dataUrl }.
export default function PhotoPicker({ name, photos, onAdd, onReplace, onRemove, disabled }) {
  const addRef = useRef(null)
  const replaceRef = useRef(null)
  const replaceIndex = useRef(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handle = async (file, action) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      await action(await processPhoto(file))
    } catch (e) {
      setError(e instanceof PhotoError || e?.message ? e.message : 'Something went wrong with that photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="w-28">
            <img
              src={p.src}
              alt={`Photo ${i + 1} of ${name || 'your cat'}`}
              className="h-28 w-28 rounded-2xl border-2 border-line object-cover"
            />
            <div className="mt-1 flex justify-between text-sm font-semibold">
              <button
                type="button"
                className="min-h-11 px-1 text-primary underline underline-offset-4"
                disabled={disabled || busy}
                onClick={() => {
                  replaceIndex.current = i
                  replaceRef.current.click()
                }}
              >
                Replace
              </button>
              <button
                type="button"
                className="min-h-11 px-1 text-muted underline underline-offset-4"
                disabled={disabled || busy}
                onClick={() => onRemove(i)}
                aria-label={`Remove photo ${i + 1}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {photos.length < LIMITS.maxPhotos && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => addRef.current.click()}
            className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surface text-sm font-semibold text-muted hover:border-primary hover:text-ink"
          >
            {photos.length === 0 ? <CameraIcon width={28} height={28} /> : <PlusIcon width={28} height={28} />}
            {busy ? 'One moment…' : photos.length === 0 ? 'Add a photo' : 'Add another'}
          </button>
        )}
      </div>
      <input
        ref={addRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files[0]
          e.target.value = ''
          handle(file, onAdd)
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files[0]
          e.target.value = ''
          handle(file, (result) => onReplace(replaceIndex.current, result))
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-urgent">
          {error}
        </p>
      )}
    </div>
  )
}
