import { useId } from 'react'

function Hint({ id, helper, error }) {
  return (
    <>
      {helper && !error && (
        <p id={`${id}-help`} className="mt-1 text-sm text-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-semibold text-urgent">
          {error}
        </p>
      )}
    </>
  )
}

const describedBy = (id, helper, error) =>
  error ? `${id}-err` : helper ? `${id}-help` : undefined

const inputClass = (error) =>
  `mt-1 block min-h-12 w-full rounded-2xl border-2 bg-surface px-4 text-base placeholder:text-muted ${
    error ? 'border-urgent' : 'border-line focus:border-primary'
  }`

export function TextField({ label, helper, error, optional, multiline, ...props }) {
  const id = useId()
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div>
      <label htmlFor={id} className="block font-bold">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        className={`${inputClass(error)} ${multiline ? 'min-h-24 py-3' : ''}`}
        {...props}
      />
      <Hint id={id} helper={helper} error={error} />
    </div>
  )
}

export function Group({ legend, helper, error, optional, children }) {
  const id = useId()
  return (
    <fieldset aria-describedby={describedBy(id, helper, error)}>
      <legend className="font-bold">
        {legend}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </legend>
      <div className="mt-2">{children}</div>
      <Hint id={id} helper={helper} error={error} />
    </fieldset>
  )
}
