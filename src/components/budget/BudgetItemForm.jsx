import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
]

export default function BudgetItemForm({ isOpen, onClose, onSubmit, item, categories, defaultCategoryId }) {
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    supplier: '',
    amount: '',
    status: 'pending',
    invoice_number: '',
    invoice_date: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const isEdit = !!item

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          category_id: item.category_id || '',
          description: item.description || '',
          supplier: item.supplier || '',
          amount: item.amount?.toString() || '',
          status: item.status || 'pending',
          invoice_number: item.invoice_number || '',
          invoice_date: item.invoice_date || '',
          notes: item.notes || '',
        })
      } else {
        setFormData({
          category_id: defaultCategoryId || '',
          description: '',
          supplier: '',
          amount: '',
          status: 'pending',
          invoice_number: '',
          invoice_date: '',
          notes: '',
        })
      }
    }
  }, [isOpen, item, defaultCategoryId])

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.description.trim() || !formData.category_id) return

    setSaving(true)
    try {
      await onSubmit({
        category_id: formData.category_id,
        description: formData.description.trim(),
        supplier: formData.supplier.trim() || null,
        amount: parseFloat(formData.amount) || 0,
        status: formData.status,
        invoice_number: formData.invoice_number.trim() || null,
        invoice_date: formData.invoice_date || null,
        notes: formData.notes.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error('BudgetItemForm submit error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Budget Item' : 'Add Budget Item'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Category <span className="text-danger">*</span>
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            required
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Description <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g. Supply and pour footings"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Supplier / Vendor
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              placeholder="e.g. ABC Concrete"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Amount (AUD) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoice_number}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              placeholder="e.g. INV-001"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Invoice Date
          </label>
          <input
            type="date"
            value={formData.invoice_date}
            onChange={(e) => handleChange('invoice_date', e.target.value)}
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
            disabled={!formData.description.trim() || !formData.category_id}
          >
            {isEdit ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
