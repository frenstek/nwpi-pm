import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'

const GST_RATE = 0.10

const INVOICE_TYPE_OPTIONS = [
  { value: 'progress', label: 'Progress' },
  { value: 'final', label: 'Final' },
  { value: 'variation', label: 'Variation' },
  { value: 'retention', label: 'Retention' },
]

function emptyItem() {
  return { description: '', quantity: 1, unit_price: 0 }
}

export default function InvoiceForm({ initialData, initialItems, invoiceNumber, onSubmit, onCancel, loading, project }) {
  const [form, setForm] = useState({
    invoice_number: '',
    type: 'progress',
    client_name: '',
    client_email: '',
    description: '',
    issue_date: '',
    due_date: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState([emptyItem()])

  useEffect(() => {
    if (initialData) {
      setForm({
        invoice_number: initialData.invoice_number || '',
        type: initialData.type || 'progress',
        client_name: initialData.client_name || '',
        client_email: initialData.client_email || '',
        description: initialData.description || '',
        issue_date: initialData.issue_date || '',
        due_date: initialData.due_date || '',
        notes: initialData.notes || '',
      })
      if (initialItems && initialItems.length > 0) {
        setLineItems(initialItems.map(it => ({
          id: it.id,
          description: it.description || '',
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price ?? 0,
        })))
      }
    } else {
      // Auto-fill from project and invoice number
      setForm(prev => ({
        ...prev,
        invoice_number: invoiceNumber || prev.invoice_number,
        client_name: project?.client_name || '',
        client_email: project?.client_email || '',
      }))
    }
  }, [initialData, initialItems, invoiceNumber, project])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleItemChange(index, field, value) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function addItem() {
    setLineItems(prev => [...prev, emptyItem()])
  }

  function removeItem(index) {
    if (lineItems.length <= 1) return
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))
  }, 0)
  const tax = subtotal * GST_RATE
  const total = subtotal + tax

  function handleSubmit(e) {
    e.preventDefault()
    const items = lineItems
      .filter(it => it.description.trim())
      .map((it, i) => ({
        ...(it.id ? { id: it.id } : {}),
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
        sort_order: i,
      }))

    onSubmit({
      invoice_number: form.invoice_number.trim(),
      type: form.type,
      client_name: form.client_name.trim() || null,
      client_email: form.client_email.trim() || null,
      description: form.description.trim() || null,
      issue_date: form.issue_date || null,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
      subtotal,
      tax,
      total,
    }, items)
  }

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'
  const labelClass = 'block text-xs font-medium text-white/50 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Invoice Number & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Invoice Number</label>
          <input
            type="text"
            name="invoice_number"
            value={form.invoice_number}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className={inputClass}
          >
            {INVOICE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Client Name</label>
          <input
            type="text"
            name="client_name"
            value={form.client_name}
            onChange={handleChange}
            placeholder="Client name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Client Email</label>
          <input
            type="email"
            name="client_email"
            value={form.client_email}
            onChange={handleChange}
            placeholder="client@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="What is this invoice for..."
          className={inputClass}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Issue Date</label>
          <input
            type="date"
            name="issue_date"
            value={form.issue_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + ' mb-0'}>Line Items</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-amber hover:text-amber-light transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>

        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-2">
          {lineItems.map((item, index) => {
            const itemTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
            return (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                    className={inputClass + ' text-right'}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                    className={inputClass + ' text-right'}
                  />
                </div>
                <div className="sm:col-span-2 text-right">
                  <span className="text-sm font-mono text-white/60">${itemTotal.toFixed(2)}</span>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={lineItems.length <= 1}
                    className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Subtotal</span>
          <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">GST (10%)</span>
          <span className="font-mono text-white">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5">
          <span className="text-white">Total (incl. GST)</span>
          <span className="font-mono text-amber">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Payment terms, bank details, etc..."
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!form.invoice_number.trim()}>
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  )
}
