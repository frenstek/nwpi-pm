import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-gradient-to-b from-amber to-amber-dark text-white hover:brightness-110 shadow-sm shadow-amber/20',
  secondary: 'border border-border text-white/60 hover:border-border-light hover:text-white/80 hover:bg-white/[0.03]',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-sm shadow-danger/20',
  ghost: 'text-white/50 hover:text-white hover:bg-white/[0.04]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  ...rest
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
