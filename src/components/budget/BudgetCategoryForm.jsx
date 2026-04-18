import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function BudgetCategoryForm({ isOpen, onClose, onSubmit, category }) {
  const [name, setName] = useState('')
  const [budgetedAmount, setBudgetedAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = !!category

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name || '')
        setBudgetedAmount(category.budgeted_amount?.toString() || '')
      } else {
        setName('')
        setBudgetedAmount('')
      }
    }
  }, [isOpen, category])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        budgeted_amount: parseFloat(budgetedAmount) || 0,
      })
      onClose()
    } catch (err) {
      console.error('BudgetCategoryForm submit error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'Add Budget Category'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Category Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Concrete, Framing, Electrical"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Budgeted Amount (AUD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
            <input
              type="number"
              value={budgetedAmount}
              onChange={(e) => setBudgetedAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full pl-7 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={saving} disabled={!name.trim()}>
            {isEdit ? 'Save Changes' : 'Add Category'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
