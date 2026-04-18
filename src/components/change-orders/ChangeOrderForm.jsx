import { useState, useEffect } from 'react'
import Button from '../ui/Button'

export default function ChangeOrderForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    reason: '',
    amount: '',
    notes: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        reason: initialData.reason || '',
        amount: initialData.amount ?? '',
        notes: initialData.notes || '',
      })
    }
  }, [initialData])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      reason: form.reason.trim() || null,
      amount: form.amount ? Number(form.amount) : 0,
      notes: form.notes.trim() || null,
    })
  }

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'
  const labelClass = 'block text-xs font-medium text-white/50 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="e.g. Additional electrical outlets in kitchen"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Describe the scope change in detail..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Reason for Change</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows={2}
          placeholder="Why is this change required..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Amount (AUD)</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="0"
          step="0.01"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Additional notes..."
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!form.title.trim()}>
          {initialData ? 'Update Change Order' : 'Create Change Order'}
        </Button>
      </div>
    </form>
  )
}
