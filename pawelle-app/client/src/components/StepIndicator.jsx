export default function StepIndicator({ step, total = 3 }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Step ${step} of ${total}`}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-8 rounded-full ${i < step ? 'bg-primary' : 'bg-line'}`}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-muted">
        Step {step} of {total}
      </p>
    </div>
  )
}
