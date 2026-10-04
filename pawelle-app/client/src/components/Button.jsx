import { Link } from 'react-router-dom'
import { SparkleIcon } from './icons.jsx'

// 'ai' and 'aiSoft' are for actions where the model gets involved; they carry the sparkle mark.
const styles = {
  primary:
    'bg-primary text-white hover:bg-primary-dark disabled:bg-line disabled:text-muted font-bold',
  secondary: 'bg-surface text-ink border-2 border-line hover:border-primary font-semibold',
  text: 'bg-transparent text-muted hover:text-ink underline underline-offset-4 font-semibold',
  danger: 'bg-urgent text-white hover:opacity-90 font-bold',
  ai: 'bg-linear-to-r from-ai to-primary text-white font-bold shadow-md shadow-ai/25 hover:brightness-110 disabled:bg-none disabled:bg-line disabled:text-muted disabled:shadow-none',
  aiSoft:
    'bg-ai-soft text-ai-dark font-bold border-2 border-transparent hover:border-ai disabled:bg-line disabled:text-muted',
}

const base =
  'group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base transition-all duration-150 motion-safe:active:scale-[0.97] disabled:cursor-not-allowed'

const isAi = (variant) => variant === 'ai' || variant === 'aiSoft'

function Content({ variant, children }) {
  return (
    <>
      {isAi(variant) && (
        <SparkleIcon className="shrink-0 animate-twinkle group-hover:rotate-12 group-disabled:animate-none" />
      )}
      {children}
    </>
  )
}

export default function Button({ variant = 'primary', className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...props}>
      <Content variant={variant}>{children}</Content>
    </button>
  )
}

export function ButtonLink({ variant = 'primary', className = '', children, ...props }) {
  return (
    <Link className={`${base} ${styles[variant]} ${className}`} {...props}>
      <Content variant={variant}>{children}</Content>
    </Link>
  )
}
