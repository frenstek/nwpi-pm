import { useState, useEffect } from 'react'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function TaskForm({ isOpen, onClose, onSave, task, phases, contacts }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    phase_id: '',
    assigned_to: '',
    status: 'pending',
    priority: 'normal',
    start_date: '',
    due_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        phase_id: task.phase_id || '',
        assigned_to: task.assigned_to || '',
        status: task.status || 'pending',
        priority: task.priority || 'normal',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
      })
    } else {
      setForm({
        title: '',
        description: '',
        phase_id: '',
        assigned_to: '',
        status: 'pending',
        priority: 'normal',
        start_date: '',
        due_date: '',
      })
    }
  }, [task, isOpen])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || null,
        phase_id: form.phase_id || null,
        assigned_to: form.assigned_to || null,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      })
      onClose()
    } catch {
      // error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Add Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. Pour concrete slab"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Task details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Phase</label>
            <select name="phase_id" value={form.phase_id} onChange={handleChange} className={inputClass}>
              <option value="">No phase</option>
              {phases.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Assigned To</label>
            <select name="assigned_to" value={form.assigned_to} onChange={handleChange} className={inputClass}>
              <option value="">Unassigned</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              {Object.entries(TASK_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
              {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
