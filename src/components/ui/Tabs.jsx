import { cn } from '../../lib/utils'

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
            'border-b-2 -mb-px',
            active === tab.id
              ? 'border-amber text-amber font-semibold'
              : 'border-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
