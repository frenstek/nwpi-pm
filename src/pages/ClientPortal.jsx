import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle, Clock, CalendarDays, Camera, Palette,
  MessageSquare, ChevronDown, ChevronRight, Send, Eye,
  LayoutDashboard, AlertTriangle, CloudRain, Cloud, Sun,
  Thermometer, Snowflake, CloudLightning, FileText,
  X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Loader2, Home,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// ------------------------------------------------------------------
// Constants (duplicated from admin to avoid import issues)
// ------------------------------------------------------------------
const PROJECT_STATUSES = {
  planning: { label: 'Planning', color: 'blue' },
  active: { label: 'Active', color: 'green' },
  on_hold: { label: 'On Hold', color: 'yellow' },
  completed: { label: 'Completed', color: 'amber' },
  cancelled: { label: 'Cancelled', color: 'red' },
}

const TASK_STATUSES = {
  pending: { label: 'Pending', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  blocked: { label: 'Blocked', color: 'red' },
  skipped: { label: 'Skipped', color: 'yellow' },
}

const SELECTION_STATUSES = {
  pending: { label: 'Pending Decision', color: 'gray' },
  selected: { label: 'Selected', color: 'amber' },
  ordered: { label: 'Ordered', color: 'blue' },
  installed: { label: 'Installed', color: 'green' },
}

const WEATHER_ICONS = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  hot: Thermometer,
  cold: Snowflake,
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatCurrency(amount) {
  if (amount == null) return '$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'd MMM yyyy')
}

function formatDateShort(date) {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yy')
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const STATUS_BADGE_COLORS = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------
function PortalBadge({ color = 'gray', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_BADGE_COLORS[color] || STATUS_BADGE_COLORS.gray,
        className
      )}
    >
      {children}
    </span>
  )
}

function PortalCard({ children, className }) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm', className)}>
      {children}
    </div>
  )
}

function PortalCardHeader({ title, icon: Icon, action }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-amber-600" />}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
  )
}

function StatBox({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center h-10 w-10 rounded-lg',
          accent === 'amber' ? 'bg-amber-50 text-amber-600' :
          accent === 'green' ? 'bg-emerald-50 text-emerald-600' :
          accent === 'blue' ? 'bg-blue-50 text-blue-600' :
          'bg-gray-50 text-gray-500'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Photo Viewer (light theme version)
// ------------------------------------------------------------------
function PortalPhotoViewer({ photos, currentIndex, onClose, onNavigate }) {
  const photo = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white/80">
        {currentIndex + 1} / {photos.length}
      </div>
      {hasPrev && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}
      <div className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh]">
        <img
          src={photo.photo_url}
          alt={photo.caption || 'Project photo'}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.caption && (
          <p className="mt-3 text-sm text-white/80 text-center max-w-lg">{photo.caption}</p>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Tab: Overview
// ------------------------------------------------------------------
function OverviewSection({ project, taskStats, dailyLogs, changeOrders }) {
  const daysRemaining = project.target_end_date
    ? Math.max(0, Math.ceil((new Date(project.target_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  const completionPct = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox
          label="Tasks Completed"
          value={`${taskStats.completed}/${taskStats.total}`}
          icon={CheckCircle}
          accent="green"
        />
        <StatBox
          label="Completion"
          value={`${completionPct}%`}
          icon={LayoutDashboard}
          accent="amber"
        />
        <StatBox
          label="Days Remaining"
          value={daysRemaining != null ? daysRemaining : '-'}
          icon={Clock}
          accent="blue"
        />
      </div>

      {/* Progress bar */}
      {taskStats.total > 0 && (
        <PortalCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-amber-600">{completionPct}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </PortalCard>
      )}

      {/* Project Details */}
      <PortalCard>
        <PortalCardHeader title="Project Details" icon={Home} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-5">
          <DetailRow label="Address" value={[project.address, project.suburb, project.state, project.postcode].filter(Boolean).join(', ')} />
          <DetailRow label="Project Type" value={project.project_type} />
          <DetailRow label="Start Date" value={formatDate(project.start_date)} />
          <DetailRow label="Target Completion" value={formatDate(project.target_end_date)} />
        </div>
        {project.description && (
          <div className="px-5 pb-5">
            <p className="text-xs font-medium text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
      </PortalCard>

      {/* Recent Daily Logs */}
      {dailyLogs.length > 0 && (
        <PortalCard>
          <PortalCardHeader title="Recent Site Updates" icon={FileText} />
          <div className="divide-y divide-gray-100">
            {dailyLogs.slice(0, 3).map(log => {
              const WeatherIcon = WEATHER_ICONS[log.weather] || Sun
              return (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">{formatDate(log.log_date)}</span>
                    <WeatherIcon className="h-4 w-4 text-gray-400" />
                    {log.weather && (
                      <span className="text-xs text-gray-400 capitalize">{log.weather}</span>
                    )}
                  </div>
                  {log.work_completed && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-gray-700">Work completed: </span>
                      {log.work_completed}
                    </p>
                  )}
                  {log.issues && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-amber-600">Issues: </span>
                      {log.issues}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </PortalCard>
      )}

      {/* Approved Change Orders */}
      {changeOrders.length > 0 && (
        <PortalCard>
          <PortalCardHeader title="Approved Change Orders" icon={FileText} />
          <div className="divide-y divide-gray-100">
            {changeOrders.map(co => (
              <div key={co.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{co.title}</span>
                  <span className="text-sm font-semibold text-amber-600 font-mono">
                    {co.cost_impact > 0 ? '+' : ''}{formatCurrency(co.cost_impact)}
                  </span>
                </div>
                {co.description && (
                  <p className="text-xs text-gray-500">{co.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDate(co.created_at)}</p>
              </div>
            ))}
          </div>
        </PortalCard>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value || '-'}</p>
    </div>
  )
}

// ------------------------------------------------------------------
// Tab: Schedule
// ------------------------------------------------------------------
function ScheduleSection({ tasks, phases }) {
  const [collapsedPhases, setCollapsedPhases] = useState({})

  // Group tasks by phase
  const groupedTasks = useMemo(() => {
    const groups = {}
    phases.forEach(p => { groups[p.id] = [] })
    groups['__unphased'] = []

    tasks.forEach(t => {
      if (t.phase_id && groups[t.phase_id]) {
        groups[t.phase_id].push(t)
      } else {
        groups['__unphased'].push(t)
      }
    })
    return groups
  }, [tasks, phases])

  function toggleCollapse(phaseId) {
    setCollapsedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  if (tasks.length === 0 && phases.length === 0) {
    return (
      <PortalCard>
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarDays className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No schedule items yet</p>
        </div>
      </PortalCard>
    )
  }

  return (
    <div className="space-y-3">
      {phases.map(phase => {
        const phaseTasks = groupedTasks[phase.id] || []
        const completedCount = phaseTasks.filter(t => t.status === 'completed').length
        const totalCount = phaseTasks.length
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        const collapsed = collapsedPhases[phase.id]

        return (
          <PortalCard key={phase.id} className="overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleCollapse(phase.id)}
            >
              <button className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer">
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
                  <PhaseStatusBadge status={phase.status} />
                  <span className="text-xs text-gray-400">
                    {completedCount}/{totalCount} tasks
                  </span>
                </div>
                {totalCount > 0 && (
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-amber-600 shrink-0">{progress}%</span>
            </div>

            {!collapsed && (
              <div className="border-t border-gray-100">
                {phaseTasks.length === 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-400 text-center">No tasks in this phase</p>
                  </div>
                ) : (
                  phaseTasks.map(task => (
                    <ReadOnlyTaskRow key={task.id} task={task} />
                  ))
                )}
              </div>
            )}
          </PortalCard>
        )
      })}

      {/* Unphased tasks */}
      {groupedTasks['__unphased']?.length > 0 && (
        <PortalCard className="overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500">Other Tasks</h3>
            <span className="text-xs text-gray-400">
              {groupedTasks['__unphased'].length} task{groupedTasks['__unphased'].length !== 1 ? 's' : ''}
            </span>
          </div>
          {groupedTasks['__unphased'].map(task => (
            <ReadOnlyTaskRow key={task.id} task={task} />
          ))}
        </PortalCard>
      )}
    </div>
  )
}

function PhaseStatusBadge({ status }) {
  const config = {
    pending: { label: 'Pending', color: 'gray' },
    in_progress: { label: 'In Progress', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
  }
  const cfg = config[status] || config.pending
  return <PortalBadge color={cfg.color}>{cfg.label}</PortalBadge>
}

function ReadOnlyTaskRow({ task }) {
  const isCompleted = task.status === 'completed'
  const statusCfg = TASK_STATUSES[task.status] || TASK_STATUSES.pending

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-b-0">
      <div className={cn(
        'flex items-center justify-center h-5 w-5 rounded-full shrink-0',
        isCompleted ? 'bg-emerald-100' : 'bg-gray-100'
      )}>
        {isCompleted ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
        )}>
          {task.title}
        </p>
      </div>
      {task.due_date && (
        <span className={cn(
          'text-xs shrink-0',
          !isCompleted && new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'
        )}>
          {formatDateShort(task.due_date)}
        </span>
      )}
      <PortalBadge color={statusCfg.color}>{statusCfg.label}</PortalBadge>
    </div>
  )
}

// ------------------------------------------------------------------
// Tab: Photos
// ------------------------------------------------------------------
function PhotosSection({ photos }) {
  const [viewerIndex, setViewerIndex] = useState(null)

  const groupedPhotos = useMemo(() => {
    const groups = {}
    for (const photo of photos) {
      const date = photo.taken_at ? photo.taken_at.split('T')[0] : 'unknown'
      if (!groups[date]) groups[date] = []
      groups[date].push(photo)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [photos])

  const flatPhotos = useMemo(() => {
    const result = []
    for (const [, group] of groupedPhotos) {
      result.push(...group)
    }
    return result
  }, [groupedPhotos])

  function openViewer(photo) {
    const idx = flatPhotos.findIndex(p => p.id === photo.id)
    setViewerIndex(idx >= 0 ? idx : 0)
  }

  if (photos.length === 0) {
    return (
      <PortalCard>
        <div className="flex flex-col items-center justify-center py-16">
          <Camera className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No photos uploaded yet</p>
        </div>
      </PortalCard>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
      {groupedPhotos.map(([date, group]) => (
        <div key={date}>
          <h3 className="text-xs font-medium text-gray-400 mb-3">
            {date === 'unknown' ? 'No date' : formatDate(date)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.map(photo => (
              <div
                key={photo.id}
                onClick={() => openViewer(photo)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:border-amber-400 transition-colors shadow-sm"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Project photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <p className="text-xs text-white/90 line-clamp-2">{photo.caption}</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1.5 rounded-lg bg-black/40 text-white/80">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {viewerIndex !== null && (
        <PortalPhotoViewer
          photos={flatPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}

// ------------------------------------------------------------------
// Tab: Selections
// ------------------------------------------------------------------
function SelectionsSection({ selections }) {
  const [collapsedCategories, setCollapsedCategories] = useState({})

  const counts = useMemo(() => {
    const c = { total: selections.length, pending: 0, selected: 0, ordered: 0, installed: 0 }
    selections.forEach(s => {
      if (c[s.status] !== undefined) c[s.status]++
    })
    return c
  }, [selections])

  const grouped = useMemo(() => {
    const map = {}
    selections.forEach(s => {
      if (!map[s.category]) map[s.category] = []
      map[s.category].push(s)
    })
    return map
  }, [selections])

  function toggleCategory(cat) {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  if (selections.length === 0) {
    return (
      <PortalCard>
        <div className="flex flex-col items-center justify-center py-16">
          <Palette className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No selections added yet</p>
        </div>
      </PortalCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <PortalCard>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Total Items</p>
              <p className="text-lg font-semibold text-gray-900">{counts.total}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Pending</p>
              <p className="text-lg font-semibold text-gray-500">{counts.pending}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Selected</p>
              <p className="text-lg font-semibold text-amber-600">{counts.selected}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Ordered</p>
              <p className="text-lg font-semibold text-blue-600">{counts.ordered}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Installed</p>
              <p className="text-lg font-semibold text-emerald-600">{counts.installed}</p>
            </div>
          </div>
          {counts.total > 0 && (
            <div className="mt-4">
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                {counts.installed > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(counts.installed / counts.total) * 100}%` }}
                  />
                )}
                {counts.ordered > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(counts.ordered / counts.total) * 100}%` }}
                  />
                )}
                {counts.selected > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(counts.selected / counts.total) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Installed
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Ordered
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Selected
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-gray-200" /> Pending
                </span>
              </div>
            </div>
          )}
        </div>
      </PortalCard>

      {/* Pending alert */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {counts.pending} item{counts.pending !== 1 ? 's' : ''} awaiting your decision
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Items marked "Pending Decision" need your input. Contact your builder to confirm selections.
            </p>
          </div>
        </div>
      )}

      {/* Grouped selections */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, items]) => {
          const isCollapsed = collapsedCategories[category]
          const catPending = items.filter(s => s.status === 'pending').length
          const catInstalled = items.filter(s => s.status === 'installed').length

          return (
            <PortalCard key={category} className="overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <button className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer">
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                    <span className="text-xs text-gray-400">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-emerald-600">{catInstalled}/{items.length} installed</span>
                  {catPending > 0 && (
                    <span className="text-amber-600 font-medium">{catPending} pending</span>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {items.map(item => {
                    const statusCfg = SELECTION_STATUSES[item.status] || SELECTION_STATUSES.pending
                    const isPending = item.status === 'pending'
                    const overdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'installed'

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'px-4 py-3',
                          isPending && 'bg-amber-50/50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">{item.item_name}</span>
                              <PortalBadge color={statusCfg.color}>{statusCfg.label}</PortalBadge>
                              {overdue && (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                                  <AlertTriangle className="h-3 w-3" />
                                  Overdue
                                </span>
                              )}
                            </div>
                            {item.selected_option && (
                              <p className="text-xs text-amber-600 mt-0.5">{item.selected_option}</p>
                            )}
                          </div>
                          {item.cost > 0 && (
                            <span className="text-sm font-medium text-gray-900 font-mono shrink-0">
                              {formatCurrency(item.cost)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
                          {item.description && (
                            <span className="text-gray-500">{item.description}</span>
                          )}
                          {item.supplier && (
                            <span>Supplier: <span className="text-gray-600">{item.supplier}</span></span>
                          )}
                          {item.due_date && (
                            <span className={overdue ? 'text-red-500' : ''}>
                              Due: <span className={overdue ? 'text-red-500 font-medium' : 'text-gray-600'}>{formatDate(item.due_date)}</span>
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </PortalCard>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Tab: Messages
// ------------------------------------------------------------------
function MessagesSection({ messages: initialMessages, projectId, clientName }) {
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState('')
  const [senderName, setSenderName] = useState(clientName || '')
  const [sending, setSending] = useState(false)
  const [showNameInput, setShowNameInput] = useState(!clientName)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = content.trim()
    const name = senderName.trim() || 'Client'
    if (!trimmed) return

    setSending(true)
    try {
      const res = await fetch(`/api/portal/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, sender_name: name }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setContent('')
      setShowNameInput(false)
    } catch {
      // Show a simple alert for the portal
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function formatTimestamp(dateStr) {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return ''
    }
  }

  return (
    <PortalCard className="flex flex-col" style={{ height: '600px' }}>
      <PortalCardHeader title="Messages" icon={MessageSquare} />

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map(msg => {
            const isClient = msg.sender_name !== 'Admin' && !msg.sender_email
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-4 py-3 max-w-[85%]',
                  isClient
                    ? 'ml-auto bg-amber-50 border border-amber-200'
                    : 'bg-gray-50 border border-gray-200'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'text-xs font-medium',
                    isClient ? 'text-amber-700' : 'text-gray-700'
                  )}>
                    {msg.sender_name}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 shrink-0">
        {showNameInput && (
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Your Name</label>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors"
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {!showNameInput && senderName && (
          <button
            type="button"
            onClick={() => setShowNameInput(true)}
            className="text-[10px] text-gray-400 hover:text-gray-600 mt-1.5 cursor-pointer"
          >
            Sending as {senderName} (change)
          </button>
        )}
      </form>
    </PortalCard>
  )
}

// ------------------------------------------------------------------
// Navigation Tabs
// ------------------------------------------------------------------
const PORTAL_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'selections', label: 'Selections', icon: Palette },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
]

function PortalTabs({ active, onChange, messageCount }) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
          {PORTAL_TABS.map(tab => {
            const isActive = active === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'messages' && messageCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                    {messageCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Main Page Component
// ------------------------------------------------------------------
export default function ClientPortal() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function loadPortalData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/portal/${projectId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('not_found')
          }
          throw new Error('failed')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadPortalData()
  }, [projectId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-amber-500 text-white font-bold text-lg mb-4 animate-pulse">
            NPI
          </div>
          <p className="text-sm text-gray-500">Loading your project...</p>
        </div>
      </div>
    )
  }

  // Error: not found
  if (error === 'not_found') {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gray-200 text-gray-400 font-bold text-lg mb-4">
            NPI
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-sm text-gray-500">
            This project link may be invalid or the project may have been removed.
            Please contact your builder for an updated link.
          </p>
        </div>
      </div>
    )
  }

  // Error: access denied or general failure
  if (error) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gray-200 text-gray-400 font-bold text-lg mb-4">
            NPI
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Project</h1>
          <p className="text-sm text-gray-500">
            We couldn't load this project right now. Please contact your builder for access.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { project, tasks, phases, photos, selections, messages, dailyLogs, changeOrders, taskStats } = data
  const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.planning

  return (
    <div className="min-h-dvh bg-gray-50" style={{ fontFamily: "'Inter Variable', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500 text-white font-bold text-sm shrink-0">
              NPI
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                Nationwide Projects Investments
              </p>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {project.name}
              </h1>
            </div>
            <PortalBadge color={statusConfig.color}>{statusConfig.label}</PortalBadge>
          </div>
        </div>
        {/* Amber accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
      </header>

      {/* Navigation */}
      <PortalTabs
        active={activeTab}
        onChange={setActiveTab}
        messageCount={messages.length}
      />

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewSection
            project={project}
            taskStats={taskStats}
            dailyLogs={dailyLogs}
            changeOrders={changeOrders}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleSection tasks={tasks} phases={phases} />
        )}
        {activeTab === 'photos' && (
          <PhotosSection photos={photos} />
        )}
        {activeTab === 'selections' && (
          <SelectionsSection selections={selections} />
        )}
        {activeTab === 'messages' && (
          <MessagesSection
            messages={messages}
            projectId={projectId}
            clientName={project.client_name}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-500 text-white font-bold text-[10px]">
                NPI
              </div>
              <span className="text-xs text-gray-400">Nationwide Projects Investments</span>
            </div>
            <p className="text-xs text-gray-400">Client Portal</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
