import Button from './Button'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
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
  )
}
