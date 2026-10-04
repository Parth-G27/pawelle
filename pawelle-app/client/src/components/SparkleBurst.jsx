import { SparkleIcon } from './icons.jsx'

const SPARKS = [
  { dx: '-58px', dy: '-26px', delay: 0, size: 16 },
  { dx: '-24px', dy: '-52px', delay: 60, size: 12 },
  { dx: '22px', dy: '-56px', delay: 20, size: 18 },
  { dx: '56px', dy: '-22px', delay: 90, size: 12 },
  { dx: '48px', dy: '30px', delay: 40, size: 14 },
  { dx: '-40px', dy: '34px', delay: 110, size: 12 },
  { dx: '4px', dy: '48px', delay: 70, size: 10 },
]

// A tiny celebration when a fresh plan arrives. Decorative only; plays once.
export default function SparkleBurst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute right-8 top-8">
      {SPARKS.map((s, i) => (
        <SparkleIcon
          key={i}
          className="absolute animate-burst text-ai"
          width={s.size}
          height={s.size}
          style={{ '--dx': s.dx, '--dy': s.dy, animationDelay: `${s.delay}ms` }}
        />
      ))}
    </span>
  )
}
