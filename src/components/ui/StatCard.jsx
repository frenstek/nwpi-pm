import { cn } from '../../lib/utils'

const colorMap = {
  amber: {
    icon: 'bg-amber/15 text-amber',
    gradient: 'from-amber/[0.06] to-transparent',
    value: 'text-white',
  },
  success: {
    icon: 'bg-success/15 text-success',
    gradient: 'from-success/[0.06] to-transparent',
    value: 'text-white',
  },
  warning: {
    icon: 'bg-warning/15 text-warning',
    gradient: 'from-warning/[0.06] to-transparent',
    value: 'text-white',
  },
  info: {
    icon: 'bg-info/15 text-info',
    gradient: 'from-info/[0.06] to-transparent',
    value: 'text-white',
  },
}

export default function StatCard({ label, value, icon: Icon, color = 'amber' }) {
  const colors = colorMap[color] || colorMap.amber

  return (
    <div className={cn(
      'relative overflow-hidden bg-void-light border border-white/[0.06] rounded-xl p-5',
      'bg-gradient-to-br',
      colors.gradient
    )}>
      <div className="flex items-center gap-4">
        <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums', colors.value)}>{value}</p>
        </div>
      </div>
    </div>
  )
}
