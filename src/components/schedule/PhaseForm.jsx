import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const PHASE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function PhaseForm({ isOpen, onClose, onSave, phase }) {
  const [form, setForm] = useState({
    name: '',
    status: 'pending',
    start_date: '',
    end_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (phase) {
      setForm({
        name: phase.name || '',
        status: phase.status || 'pending',
        start_date: phase.start_date || '',
        end_date: phase.end_date || '',
      })
    } else {
      setForm({ name: '', status: 'pending', start_date: '', end_date: '' })
    }
  }, [phase, isOpen])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
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
    <Modal isOpen={isOpen} onClose={onClose} title={phase ? 'Edit Phase' : 'Add Phase'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. Site Prep"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {PHASE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
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
            <label className="block text-xs font-medium text-white/50 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {phase ? 'Update Phase' : 'Create Phase'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
