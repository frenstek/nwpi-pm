import { cn } from '../../lib/utils'

const variants = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  neutral: 'bg-white/[0.06] text-white/60 border-white/10',
}

export default function Badge({ variant = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
