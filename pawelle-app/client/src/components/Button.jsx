const styles = {
  primary:
    'bg-primary text-white hover:bg-primary-dark disabled:bg-line disabled:text-muted font-bold',
  secondary: 'bg-surface text-ink border-2 border-line hover:border-primary font-semibold',
  text: 'bg-transparent text-muted hover:text-ink underline underline-offset-4 font-semibold',
  danger: 'bg-urgent text-white hover:opacity-90 font-bold',
}

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
