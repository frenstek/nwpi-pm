import Button from './Button'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,133,12,0.03)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      <div className="relative z-10 flex flex-col items-center">
        {Icon && (
          <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-6 animate-float">
            <Icon className="h-9 w-9 text-white/25" />
          </div>
        )}
        <h3 className="text-base font-semibold text-white/70 mb-1.5">{title}</h3>
        {description && (
          <p className="text-sm text-white/35 mb-8 text-center max-w-xs">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
