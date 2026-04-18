import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, CheckSquare, Square, Trash2, Pencil, CalendarDays, AlertTriangle, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTodos } from '../../hooks/useTodos'
import { TODO_PRIORITIES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import Skeleton from '../ui/Skeleton'

export default function TodosTab({ projectId }) {
  const { todos, loading, fetchTodos, createTodo, updateTodo, toggleComplete, deleteTodo } = useTodos()
  const [quickAdd, setQuickAdd] = useState('')
  const [formModal, setFormModal] = useState({ open: false, todo: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' })
  const [showCompleted, setShowCompleted] = useState(false)

  const loadData = useCallback(async () => {
    await fetchTodos(projectId)
  }, [projectId, fetchTodos])

  useEffect(() => {
    loadData()
  }, [loadData])

  const incomplete = useMemo(() => todos.filter(t => !t.is_completed), [todos])
  const completed = useMemo(() => todos.filter(t => t.is_completed), [todos])

  async function handleQuickAdd(e) {
    e.preventDefault()
    if (!quickAdd.trim()) return
    try {
      await createTodo({ project_id: projectId, title: quickAdd.trim() })
      setQuickAdd('')
      toast.success('To-do added')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to add to-do')
    }
  }

  async function handleToggle(todo) {
    try {
      await toggleComplete(todo.id, todo.is_completed)
      toast.success(todo.is_completed ? 'Marked incomplete' : 'Completed!')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update to-do')
    }
  }

  async function handleFormSubmit(data) {
    try {
      if (formModal.todo) {
        await updateTodo(formModal.todo.id, data)
        toast.success('To-do updated')
      } else {
        await createTodo({ ...data, project_id: projectId })
        toast.success('To-do added')
      }
      setFormModal({ open: false, todo: null })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save to-do')
    }
  }

  async function handleDelete() {
    try {
      await deleteTodo(deleteConfirm.id)
      toast.success('To-do deleted')
      setDeleteConfirm({ open: false, id: null, title: '' })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete to-do')
    }
  }

  if (loading && todos.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={quickAdd}
          onChange={e => setQuickAdd(e.target.value)}
          placeholder="Quick add to-do..."
          className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
        />
        <Button type="submit" size="sm" disabled={!quickAdd.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setFormModal({ open: true, todo: null })}>
          Detailed
        </Button>
      </form>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>{incomplete.length} remaining</span>
        <span>{completed.length} completed</span>
        {incomplete.length > 0 && (
          <span className="text-white/60">
            {Math.round((completed.length / todos.length) * 100)}% done
          </span>
        )}
      </div>

      {/* Incomplete Todos */}
      <div className="space-y-1">
        {incomplete.length === 0 && completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-surface mb-3">
              <CheckSquare className="h-7 w-7 text-white/20" />
            </div>
            <p className="text-sm text-white/40 mb-1">No to-dos yet</p>
            <p className="text-xs text-white/25">Use the quick add above to create your first to-do</p>
          </div>
        ) : (
          <>
            {incomplete.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => handleToggle(todo)}
                onEdit={() => setFormModal({ open: true, todo })}
                onDelete={() => setDeleteConfirm({ open: true, id: todo.id, title: todo.title })}
              />
            ))}
          </>
        )}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-white/30 hover:text-white/50 transition-colors cursor-pointer mb-2"
          >
            {showCompleted ? 'Hide' : 'Show'} {completed.length} completed
          </button>
          {showCompleted && (
            <div className="space-y-1 opacity-60">
              {completed.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggle(todo)}
                  onEdit={() => setFormModal({ open: true, todo })}
                  onDelete={() => setDeleteConfirm({ open: true, id: todo.id, title: todo.title })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <TodoFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, todo: null })}
        onSubmit={handleFormSubmit}
        todo={formModal.todo}
      />

      {/* Delete Confirm */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })} />
          <div className="relative w-full max-w-sm bg-void-light border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Delete to-do?</h3>
            <p className="text-sm text-white/50 mb-4">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.title}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const priorityCfg = TODO_PRIORITIES[todo.priority] || TODO_PRIORITIES.normal
  const isOverdue = todo.due_date && !todo.is_completed && new Date(todo.due_date) < new Date(new Date().toDateString())

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface/30 transition-colors group">
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 cursor-pointer text-white/30 hover:text-amber transition-colors"
      >
        {todo.is_completed ? (
          <CheckSquare className="h-4 w-4 text-success" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${todo.is_completed ? 'line-through text-white/30' : 'text-white'}`}>
          {todo.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-white/30">
          {todo.priority !== 'normal' && (
            <Badge variant={priorityCfg.color} className="text-[10px]">{priorityCfg.label}</Badge>
          )}
          {todo.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger' : ''}`}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(todo.due_date)}
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
            </span>
          )}
          {todo.assigned_to && <span>{todo.assigned_to}</span>}
          {todo.category && todo.category !== 'general' && <span className="capitalize">{todo.category}</span>}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onEdit}
          className="p-1 rounded text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-white/20 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function TodoFormModal({ isOpen, onClose, onSubmit, todo }) {
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'normal', due_date: '',
    assigned_to: '', category: 'general',
  })
  const [saving, setSaving] = useState(false)
  const isEdit = !!todo

  useEffect(() => {
    if (isOpen) {
      if (todo) {
        setFormData({
          title: todo.title || '',
          description: todo.description || '',
          priority: todo.priority || 'normal',
          due_date: todo.due_date || '',
          assigned_to: todo.assigned_to || '',
          category: todo.category || 'general',
        })
      } else {
        setFormData({
          title: '', description: '', priority: 'normal', due_date: '',
          assigned_to: '', category: 'general',
        })
      }
    }
  }, [isOpen, todo])

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.title.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to.trim() || null,
        category: formData.category,
      })
    } catch (err) {
      // handled by parent
    } finally {
      setSaving(false)
    }
  }

  const CATEGORIES = ['general', 'admin', 'site', 'client', 'inspection', 'procurement', 'other']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit To-Do' : 'Add To-Do'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Additional details..."
            rows={2}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Priority</label>
            <select
              value={formData.priority}
              onChange={e => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            >
              {Object.entries(TODO_PRIORITIES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber capitalize"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={e => handleChange('due_date', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={e => handleChange('assigned_to', e.target.value)}
              placeholder="Team member"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving} disabled={!formData.title.trim()}>
            {isEdit ? 'Save Changes' : 'Add To-Do'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
