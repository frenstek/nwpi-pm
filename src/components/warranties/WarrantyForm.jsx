import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { WARRANTY_STATUSES, WARRANTY_PRIORITIES } from '../../lib/constants'

export default function WarrantyForm({ isOpen, onClose, onSubmit, warranty }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    status: 'submitted',
    priority: 'normal',
    submitted_by: '',
    submitted_date: new Date().toISOString().split('T')[0],
    resolved_date: '',
    resolution_notes: '',
    assigned_to: '',
  })
  const [saving, setSaving] = useState(false)
  const isEdit = !!warranty

  useEffect(() => {
    if (isOpen) {
      if (warranty) {
        setFormData({
          title: warranty.title || '',
          description: warranty.description || '',
          category: warranty.category || 'general',
          status: warranty.status || 'submitted',
          priority: warranty.priority || 'normal',
          submitted_by: warranty.submitted_by || '',
          submitted_date: warranty.submitted_date || new Date().toISOString().split('T')[0],
          resolved_date: warranty.resolved_date || '',
          resolution_notes: warranty.resolution_notes || '',
          assigned_to: warranty.assigned_to || '',
        })
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'general',
          status: 'submitted',
          priority: 'normal',
          submitted_by: '',
          submitted_date: new Date().toISOString().split('T')[0],
          resolved_date: '',
          resolution_notes: '',
          assigned_to: '',
        })
      }
    }
  }, [isOpen, warranty])

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
        category: formData.category,
        status: formData.status,
        priority: formData.priority,
        submitted_by: formData.submitted_by.trim() || null,
        submitted_date: formData.submitted_date || null,
        resolved_date: formData.resolved_date || null,
        resolution_notes: formData.resolution_notes.trim() || null,
        assigned_to: formData.assigned_to.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error('WarrantyForm submit error:', err)
    } finally {
      setSaving(false)
    }
  }

  const CATEGORIES = ['general', 'structural', 'plumbing', 'electrical', 'painting', 'roofing', 'flooring', 'waterproofing', 'other']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Warranty Claim' : 'New Warranty Claim'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g. Cracked bathroom tiles"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber capitalize"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Priority</label>
            <select
              value={formData.priority}
              onChange={e => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            >
              {Object.entries(WARRANTY_PRIORITIES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Detailed description of the warranty claim..."
            rows={3}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            >
              {Object.entries(WARRANTY_STATUSES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Submitted Date</label>
            <input
              type="date"
              value={formData.submitted_date}
              onChange={e => handleChange('submitted_date', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Submitted By</label>
            <input
              type="text"
              value={formData.submitted_by}
              onChange={e => handleChange('submitted_by', e.target.value)}
              placeholder="Client name"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={e => handleChange('assigned_to', e.target.value)}
              placeholder="Team member or trade"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        {(formData.status === 'resolved' || formData.status === 'rejected') && (
          <>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Resolved Date</label>
              <input
                type="date"
                value={formData.resolved_date}
                onChange={e => handleChange('resolved_date', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-amber"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Resolution Notes</label>
              <textarea
                value={formData.resolution_notes}
                onChange={e => handleChange('resolution_notes', e.target.value)}
                placeholder="How the issue was resolved..."
                rows={2}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber resize-none"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving} disabled={!formData.title.trim()}>
            {isEdit ? 'Save Changes' : 'Submit Claim'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
