import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { SELECTION_CATEGORIES } from '../../lib/constants'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'selected', label: 'Selected' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'installed', label: 'Installed' },
]

export default function SelectionForm({ isOpen, onClose, onSubmit, selection, defaultCategory }) {
  const [formData, setFormData] = useState({
    category: '',
    item_name: '',
    description: '',
    supplier: '',
    cost: '',
    selected_option: '',
    status: 'pending',
    due_date: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const isEdit = !!selection

  useEffect(() => {
    if (isOpen) {
      if (selection) {
        setFormData({
          category: selection.category || '',
          item_name: selection.item_name || '',
          description: selection.description || '',
          supplier: selection.supplier || '',
          cost: selection.cost?.toString() || '',
          selected_option: selection.selected_option || '',
          status: selection.status || 'pending',
          due_date: selection.due_date || '',
          notes: selection.notes || '',
        })
      } else {
        setFormData({
          category: defaultCategory || '',
          item_name: '',
          description: '',
          supplier: '',
          cost: '',
          selected_option: '',
          status: 'pending',
          due_date: '',
          notes: '',
        })
      }
    }
  }, [isOpen, selection, defaultCategory])

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.item_name.trim() || !formData.category) return

    setSaving(true)
    try {
      await onSubmit({
        category: formData.category,
        item_name: formData.item_name.trim(),
        description: formData.description.trim() || null,
        supplier: formData.supplier.trim() || null,
        cost: parseFloat(formData.cost) || 0,
        selected_option: formData.selected_option.trim() || null,
        status: formData.status,
        due_date: formData.due_date || null,
        notes: formData.notes.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error('SelectionForm submit error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Selection' : 'Add Selection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Category <span className="text-danger">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
              required
            >
              <option value="">Select category...</option>
              {SELECTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Item Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => handleChange('item_name', e.target.value)}
            placeholder="e.g. Kitchen Benchtop"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Material details, specifications, colour codes..."
            rows={2}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              placeholder="e.g. Caesarstone"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Cost (AUD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Selected Option
          </label>
          <input
            type="text"
            value={formData.selected_option}
            onChange={(e) => handleChange('selected_option', e.target.value)}
            placeholder="e.g. Caesarstone Empira White 20mm"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => handleChange('due_date', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={saving}
            disabled={!formData.item_name.trim() || !formData.category}
          >
            {isEdit ? 'Save Changes' : 'Add Selection'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
