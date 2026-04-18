import { useMemo } from 'react'
import { format, eachDayOfInterval, eachWeekOfInterval, differenceInDays, isToday, startOfDay, addDays } from 'date-fns'
import { TASK_STATUSES } from '../../lib/constants'

const PHASE_COLORS = [
  '#E8850C', // amber
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
]

function getPhaseColor(phaseIndex) {
  return PHASE_COLORS[phaseIndex % PHASE_COLORS.length]
}

function getStatusColor(status) {
  const map = {
    pending: '#666666',
    in_progress: '#3B82F6',
    completed: '#22C55E',
    blocked: '#EF4444',
    skipped: '#F59E0B',
  }
  return map[status] || '#666666'
}

export default function GanttChart({ tasks, phases, startDate, endDate }) {
  const { dateRange, useWeeks, dayWidth, columns } = useMemo(() => {
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date())
    const end = endDate ? startOfDay(new Date(endDate)) : addDays(start, 90)
    const totalDays = differenceInDays(end, start) + 1
    const useWeeks = totalDays > 60
    const dayWidth = useWeeks ? 6 : 32

    let columns
    if (useWeeks) {
      columns = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(d => ({
        date: d,
        label: format(d, 'd MMM'),
        isToday: false,
      }))
    } else {
      columns = eachDayOfInterval({ start, end }).map(d => ({
        date: d,
        label: format(d, 'd'),
        monthLabel: format(d, 'MMM'),
        isToday: isToday(d),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      }))
    }

    return { dateRange: { start, end }, useWeeks, dayWidth, columns }
  }, [startDate, endDate])

  const phaseMap = useMemo(() => {
    const map = {}
    phases.forEach((p, i) => { map[p.id] = { ...p, colorIndex: i } })
    return map
  }, [phases])

  // Group tasks by phase for row ordering
  const sortedTasks = useMemo(() => {
    const phased = []
    const unphased = []
    tasks.forEach(t => {
      if (t.phase_id && phaseMap[t.phase_id]) {
        phased.push(t)
      } else {
        unphased.push(t)
      }
    })
    return [...phased, ...unphased]
  }, [tasks, phaseMap])

  function getBarPosition(task) {
    const taskStart = task.start_date ? startOfDay(new Date(task.start_date)) : null
    const taskEnd = task.due_date ? startOfDay(new Date(task.due_date)) : null
    if (!taskStart && !taskEnd) return null

    const effectiveStart = taskStart || taskEnd
    const effectiveEnd = taskEnd || taskStart

    const leftDays = differenceInDays(effectiveStart, dateRange.start)
    const widthDays = differenceInDays(effectiveEnd, effectiveStart) + 1

    const left = Math.max(0, leftDays * dayWidth)
    const width = Math.max(dayWidth, widthDays * dayWidth)

    return { left, width }
  }

  // Today marker position
  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date())
    const days = differenceInDays(today, dateRange.start)
    if (days < 0 || days > differenceInDays(dateRange.end, dateRange.start)) return null
    return days * dayWidth
  }, [dateRange, dayWidth])

  const gridWidth = columns.length * (useWeeks ? 42 : dayWidth)
  const ROW_HEIGHT = 36
  const HEADER_HEIGHT = 48
  const LABEL_WIDTH = 200

  if (sortedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-white/30">Add tasks with dates to see the timeline</p>
      </div>
    )
  }

  return (
    <div className="bg-void-light border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full">
          {/* Fixed labels column */}
          <div className="shrink-0" style={{ width: LABEL_WIDTH }}>
            {/* Header spacer */}
            <div
              className="border-b border-r border-border bg-void-lighter px-3 flex items-center"
              style={{ height: HEADER_HEIGHT }}
            >
              <span className="text-xs font-medium text-white/40">Task</span>
            </div>
            {/* Task labels */}
            {sortedTasks.map(task => {
              const phaseInfo = task.phase_id ? phaseMap[task.phase_id] : null
              const barColor = phaseInfo
                ? getPhaseColor(phaseInfo.colorIndex)
                : getStatusColor(task.status)

              return (
                <div
                  key={task.id}
                  className="border-b border-r border-border px-3 flex items-center gap-2"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: barColor }}
                  />
                  <span className="text-xs text-white/70 truncate">{task.title}</span>
                </div>
              )
            })}
          </div>

          {/* Scrollable chart area */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: gridWidth, position: 'relative' }}>
              {/* Date headers */}
              <div className="flex border-b border-border bg-void-lighter" style={{ height: HEADER_HEIGHT }}>
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className="shrink-0 flex flex-col items-center justify-center border-r border-border/50"
                    style={{ width: useWeeks ? 42 : dayWidth }}
                  >
                    {!useWeeks && i === 0 && (
                      <span className="text-[10px] text-white/30">{col.monthLabel}</span>
                    )}
                    {!useWeeks && i > 0 && columns[i - 1].monthLabel !== col.monthLabel && (
                      <span className="text-[10px] text-white/30">{col.monthLabel}</span>
                    )}
                    <span className={`text-[10px] ${col.isToday ? 'text-amber font-bold' : 'text-white/40'}`}>
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task rows */}
              {sortedTasks.map(task => {
                const bar = getBarPosition(task)
                const phaseInfo = task.phase_id ? phaseMap[task.phase_id] : null
                const barColor = phaseInfo
                  ? getPhaseColor(phaseInfo.colorIndex)
                  : getStatusColor(task.status)
                const isCompleted = task.status === 'completed'
                const isMilestone = !task.start_date && task.due_date

                return (
                  <div
                    key={task.id}
                    className="relative border-b border-border/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Background columns */}
                    <div className="absolute inset-0 flex">
                      {columns.map((col, i) => (
                        <div
                          key={i}
                          className={`shrink-0 border-r border-border/20 ${col.isWeekend ? 'bg-white/[0.02]' : ''}`}
                          style={{ width: useWeeks ? 42 : dayWidth }}
                        />
                      ))}
                    </div>

                    {/* Task bar */}
                    {bar && !isMilestone && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-sm"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          height: 16,
                          backgroundColor: barColor,
                          opacity: isCompleted ? 0.5 : 0.85,
                        }}
                      />
                    )}

                    {/* Milestone diamond */}
                    {bar && isMilestone && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                        style={{
                          left: bar.left + dayWidth / 2,
                          backgroundColor: barColor,
                        }}
                      />
                    )}
                  </div>
                )
              })}

              {/* Today marker */}
              {todayOffset != null && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-amber/60 z-10 pointer-events-none"
                  style={{ left: todayOffset }}
                >
                  <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-amber rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
