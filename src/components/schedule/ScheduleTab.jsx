import { useState, useEffect, useCallback } from 'react'
import {
  Plus, List, BarChart3, ChevronDown, ChevronRight,
  Pencil, Trash2, CheckSquare, Square, GripVertical,
  CalendarDays,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTasks } from '../../hooks/useTasks'
import { useContacts } from '../../hooks/useContacts'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants'
import { formatDateShort } from '../../lib/utils'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import TaskForm from './TaskForm'
import PhaseForm from './PhaseForm'
import GanttChart from './GanttChart'

export default function ScheduleTab({ projectId, project }) {
  const {
    tasks, loading, fetchTasks, createTask, updateTask, deleteTask,
    fetchPhases, createPhase, updatePhase, deletePhase,
  } = useTasks()
  const { contacts, fetchContacts } = useContacts()

  const [phases, setPhases] = useState([])
  const [view, setView] = useState('list') // list | timeline
  const [collapsedPhases, setCollapsedPhases] = useState({})

  // Modal state
  const [taskModal, setTaskModal] = useState({ open: false, task: null })
  const [phaseModal, setPhaseModal] = useState({ open: false, phase: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '' })

  const loadData = useCallback(async () => {
    const [fetchedPhases] = await Promise.all([
      fetchPhases(projectId),
      fetchTasks(projectId),
      fetchContacts(),
    ])
    setPhases(fetchedPhases)
  }, [projectId, fetchPhases, fetchTasks, fetchContacts])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Group tasks by phase
  const groupedTasks = (() => {
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
  })()

  function toggleCollapse(phaseId) {
    setCollapsedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  // Task handlers
  async function handleSaveTask(data) {
    try {
      if (taskModal.task) {
        await updateTask(taskModal.task.id, data)
        toast.success('Task updated')
      } else {
        await createTask({ ...data, project_id: projectId })
        toast.success('Task created')
      }
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save task')
      throw err
    }
  }

  async function handleToggleComplete(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await updateTask(task.id, { status: newStatus })
      await loadData()
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task reopened')
    } catch {
      toast.error('Failed to update task')
    }
  }

  // Phase handlers
  async function handleSavePhase(data) {
    try {
      if (phaseModal.phase) {
        await updatePhase(phaseModal.phase.id, data)
        toast.success('Phase updated')
      } else {
        const maxSort = phases.length > 0 ? Math.max(...phases.map(p => p.sort_order || 0)) : -1
        await createPhase({ ...data, project_id: projectId, sort_order: maxSort + 1 })
        toast.success('Phase created')
      }
      const updated = await fetchPhases(projectId)
      setPhases(updated)
      await fetchTasks(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to save phase')
      throw err
    }
  }

  // Delete handler
  async function handleDelete() {
    const { type, id } = deleteConfirm
    try {
      if (type === 'task') {
        await deleteTask(id)
        toast.success('Task deleted')
      } else {
        await deletePhase(id)
        toast.success('Phase deleted')
      }
      setDeleteConfirm({ open: false, type: null, id: null, name: '' })
      await loadData()
    } catch {
      toast.error(`Failed to delete ${type}`)
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const phaseStatusConfig = {
    pending: { label: 'Pending', color: 'neutral' },
    in_progress: { label: 'In Progress', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setPhaseModal({ open: true, phase: null })}>
            <Plus className="h-3.5 w-3.5" />
            Add Phase
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setTaskModal({ open: true, task: null })}>
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-surface rounded-lg border border-border">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              view === 'list' ? 'bg-amber text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              view === 'timeline' ? 'bg-amber text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-3">
          {tasks.length === 0 && phases.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No tasks yet"
              description="Add phases and tasks to build your construction schedule."
              action={{ label: 'Add Task', onClick: () => setTaskModal({ open: true, task: null }) }}
            />
          ) : (
            <>
              {phases.map(phase => {
                const phaseTasks = groupedTasks[phase.id] || []
                const completedCount = phaseTasks.filter(t => t.status === 'completed').length
                const totalCount = phaseTasks.length
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                const collapsed = collapsedPhases[phase.id]
                const statusCfg = phaseStatusConfig[phase.status] || phaseStatusConfig.pending

                return (
                  <div key={phase.id} className="bg-void-light border border-border rounded-xl overflow-hidden">
                    {/* Phase header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                      onClick={() => toggleCollapse(phase.id)}
                    >
                      <button className="text-white/40 hover:text-white shrink-0 cursor-pointer">
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white">{phase.name}</h3>
                          <Badge variant={statusCfg.color}>{statusCfg.label}</Badge>
                          <span className="text-xs text-white/30">
                            {completedCount}/{totalCount} tasks
                          </span>
                        </div>
                        {/* Progress bar */}
                        {totalCount > 0 && (
                          <div className="mt-1.5 h-1 bg-surface rounded-full overflow-hidden max-w-xs">
                            <div
                              className="h-full bg-amber rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setPhaseModal({ open: true, phase })}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, type: 'phase', id: phase.id, name: phase.name })}
                          className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks under this phase */}
                    {!collapsed && (
                      <div className="border-t border-border/50">
                        {phaseTasks.length === 0 ? (
                          <div className="px-4 py-3">
                            <p className="text-xs text-white/20 text-center">No tasks in this phase</p>
                          </div>
                        ) : (
                          phaseTasks.map(task => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              onToggle={() => handleToggleComplete(task)}
                              onEdit={() => setTaskModal({ open: true, task })}
                              onDelete={() => setDeleteConfirm({ open: true, type: 'task', id: task.id, name: task.title })}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Unphased tasks */}
              {groupedTasks['__unphased']?.length > 0 && (
                <div className="bg-void-light border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white/50">Unphased Tasks</h3>
                    </div>
                    <span className="text-xs text-white/30">
                      {groupedTasks['__unphased'].length} task{groupedTasks['__unphased'].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {groupedTasks['__unphased'].map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleComplete(task)}
                      onEdit={() => setTaskModal({ open: true, task })}
                      onDelete={() => setDeleteConfirm({ open: true, type: 'task', id: task.id, name: task.title })}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <GanttChart
          tasks={tasks}
          phases={phases}
          startDate={project?.start_date}
          endDate={project?.target_end_date}
        />
      )}

      {/* Task Form Modal */}
      <TaskForm
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        onSave={handleSaveTask}
        task={taskModal.task}
        phases={phases}
        contacts={contacts}
      />

      {/* Phase Form Modal */}
      <PhaseForm
        isOpen={phaseModal.open}
        onClose={() => setPhaseModal({ open: false, phase: null })}
        onSave={handleSavePhase}
        phase={phaseModal.phase}
      />

      {/* Delete Confirmation */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })} />
          <div className="relative w-full max-w-sm bg-void-light border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete {deleteConfirm.type}?</h3>
            <p className="text-sm text-white/50 mb-6">
              Are you sure you want to delete <span className="text-white/80 font-medium">"{deleteConfirm.name}"</span>?
              {deleteConfirm.type === 'phase' && ' Tasks in this phase will become unphased.'}
              {' '}This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Task Row Sub-component ---
function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const isCompleted = task.status === 'completed'
  const statusCfg = TASK_STATUSES[task.status] || TASK_STATUSES.pending
  const priorityCfg = TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.normal
  const assigneeName = task.assignee?.name || null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/30 transition-colors border-b border-border/30 last:border-b-0 group">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 text-white/30 hover:text-amber transition-colors cursor-pointer"
      >
        {isCompleted
          ? <CheckSquare className="h-4 w-4 text-success" />
          : <Square className="h-4 w-4" />
        }
      </button>

      {/* Title + assignee */}
      <div className="flex-1 min-w-0">
        <button
          onClick={onEdit}
          className={`text-sm text-left cursor-pointer hover:text-amber transition-colors truncate block w-full ${
            isCompleted ? 'text-white/30 line-through' : 'text-white/80'
          }`}
        >
          {task.title}
        </button>
        {assigneeName && (
          <p className="text-[11px] text-white/25 truncate">{assigneeName}</p>
        )}
      </div>

      {/* Due date */}
      {task.due_date && (
        <span className={`text-xs shrink-0 ${
          !isCompleted && new Date(task.due_date) < new Date() ? 'text-danger' : 'text-white/30'
        }`}>
          {formatDateShort(task.due_date)}
        </span>
      )}

      {/* Priority badge (only if high or urgent) */}
      {(task.priority === 'high' || task.priority === 'urgent') && (
        <Badge variant={priorityCfg.color} className="shrink-0">{priorityCfg.label}</Badge>
      )}

      {/* Status badge */}
      <Badge variant={statusCfg.color} className="shrink-0">{statusCfg.label}</Badge>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          className="p-1 rounded text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-white/30 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
