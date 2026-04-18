import { useState, useEffect, useCallback } from 'react'
import {
  Plus, FileText, Pencil, Trash2, ChevronDown, ChevronRight,
  Send, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle,
  CreditCard,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useInvoices } from '../../hooks/useInvoices'
import { INVOICE_STATUSES, INVOICE_TYPES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import InvoiceForm from './InvoiceForm'

function InvoiceCard({ invoice, onEdit, onDelete, onStatusChange, onMarkPaid, onExpand, expanded }) {
  const statusConfig = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.draft
  const typeConfig = INVOICE_TYPES[invoice.type] || INVOICE_TYPES.progress
  const balance = (Number(invoice.total) || 0) - (Number(invoice.amount_paid) || 0)

  return (
    <div className="bg-void-light border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
        onClick={onExpand}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button className="text-white/40 hover:text-white transition-colors">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <span className="text-xs font-mono font-semibold text-amber shrink-0">{invoice.invoice_number}</span>
          <Badge variant={typeConfig.color}>{typeConfig.label}</Badge>
          <span className="text-sm font-semibold text-white truncate hidden sm:inline">
            {invoice.client_name || 'No client'}
          </span>
          <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-mono font-semibold text-white">{formatCurrency(invoice.total)}</span>
            {balance > 0 && invoice.status !== 'paid' && (
              <span className="text-[10px] font-mono text-danger">
                Balance: {formatCurrency(balance)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {(invoice.status === 'draft' || invoice.status === 'sent') && (
              <button
                onClick={() => onEdit(invoice)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {invoice.status === 'draft' && (
              <button
                onClick={() => onDelete(invoice)}
                className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-white/40">
            {invoice.description && (
              <div className="w-full">
                <p className="text-white/60 text-sm">{invoice.description}</p>
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              {invoice.client_name && <span>Client: {invoice.client_name}</span>}
              {invoice.client_email && <span>Email: {invoice.client_email}</span>}
              {invoice.issue_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Issued: {formatDate(invoice.issue_date)}
                </span>
              )}
              {invoice.due_date && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Due: {formatDate(invoice.due_date)}
                </span>
              )}
              {invoice.paid_date && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" /> Paid: {formatDate(invoice.paid_date)}
                </span>
              )}
              <span>{invoice.items_count} item{invoice.items_count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4 bg-surface/30 rounded-lg p-3">
            <div>
              <p className="text-[10px] font-medium text-white/40 mb-0.5">Total</p>
              <p className="text-sm font-mono font-semibold text-white">{formatCurrency(invoice.total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-white/40 mb-0.5">Paid</p>
              <p className="text-sm font-mono font-semibold text-success">{formatCurrency(invoice.amount_paid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-white/40 mb-0.5">Balance</p>
              <p className={`text-sm font-mono font-semibold ${balance > 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          {/* Line Items */}
          {invoice.pm_invoice_items && invoice.pm_invoice_items.length > 0 && (
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white/30 bg-surface/30">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              <div className="divide-y divide-border/50">
                {invoice.pm_invoice_items.map(item => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5">
                    <div className="sm:col-span-5 text-sm text-white">{item.description}</div>
                    <div className="sm:col-span-2 text-sm text-white/60 font-mono text-right">{item.quantity}</div>
                    <div className="sm:col-span-2 text-sm text-white/60 font-mono text-right">${Number(item.unit_price).toFixed(2)}</div>
                    <div className="sm:col-span-3 text-sm text-white font-mono text-right">${Number(item.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50 px-4 py-2 bg-surface/20">
                <div className="flex justify-between text-xs text-white/50">
                  <span>Subtotal</span>
                  <span className="font-mono">${Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>GST (10%)</span>
                  <span className="font-mono">${Number(invoice.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-amber mt-1">
                  <span>Total</span>
                  <span className="font-mono">${Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-1">Notes</p>
              <p className="text-sm text-white/50 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="flex items-center gap-2 pt-1">
            {invoice.status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange(invoice, 'sent')}>
                <Send className="h-3.5 w-3.5" />
                Mark as Sent
              </Button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <Button size="sm" onClick={() => onMarkPaid(invoice)}>
                <CreditCard className="h-3.5 w-3.5" />
                Mark as Paid
              </Button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <Button size="sm" variant="danger" onClick={() => onStatusChange(invoice, 'cancelled')}>
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function InvoicesTab({ projectId, project }) {
  const {
    invoices, loading,
    fetchInvoices, fetchInvoice, generateInvoiceNumber,
    createInvoice, updateInvoice, deleteInvoice,
    createInvoiceItem, updateInvoiceItem, deleteInvoiceItem,
  } = useInvoices()

  const [showForm, setShowForm] = useState(false)
  const [editingInv, setEditingInv] = useState(null)
  const [editingItems, setEditingItems] = useState([])
  const [newInvNumber, setNewInvNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const loadData = useCallback(async () => {
    await fetchInvoices(projectId)
  }, [projectId, fetchInvoices])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute summary
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0)
  const outstanding = totalInvoiced - totalPaid
  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false
    if (!inv.due_date) return false
    return new Date(inv.due_date) < new Date()
  }).length

  async function handleNew() {
    const num = await generateInvoiceNumber(projectId)
    setNewInvNumber(num)
    setEditingInv(null)
    setEditingItems([])
    setShowForm(true)
  }

  async function handleEdit(invoice) {
    const full = await fetchInvoice(invoice.id)
    if (full) {
      setEditingInv(full)
      setEditingItems(full.pm_invoice_items || [])
      setNewInvNumber('')
      setShowForm(true)
    }
  }

  async function handleSubmit(formData, items) {
    setSaving(true)
    try {
      if (editingInv) {
        await updateInvoice(editingInv.id, formData)

        const existingIds = items.filter(it => it.id).map(it => it.id)
        const oldItems = editingItems || []

        for (const old of oldItems) {
          if (!existingIds.includes(old.id)) {
            await deleteInvoiceItem(old.id)
          }
        }

        for (const item of items) {
          if (item.id) {
            await updateInvoiceItem(item.id, {
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              sort_order: item.sort_order,
            })
          } else {
            await createInvoiceItem({
              invoice_id: editingInv.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              sort_order: item.sort_order,
            })
          }
        }

        toast.success('Invoice updated')
      } else {
        const inv = await createInvoice({
          ...formData,
          project_id: projectId,
        })

        for (const item of items) {
          await createInvoiceItem({
            invoice_id: inv.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            sort_order: item.sort_order,
          })
        }

        toast.success('Invoice created')
      }

      setShowForm(false)
      setEditingInv(null)
      setEditingItems([])
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(invoice) {
    if (!confirm(`Delete invoice "${invoice.invoice_number}"?`)) return
    try {
      await deleteInvoice(invoice.id)
      toast.success('Invoice deleted')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice')
    }
  }

  async function handleStatusChange(invoice, newStatus) {
    try {
      await updateInvoice(invoice.id, { status: newStatus })
      toast.success(`Invoice marked as ${newStatus}`)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  async function handleMarkPaid(invoice) {
    try {
      await updateInvoice(invoice.id, {
        status: 'paid',
        amount_paid: invoice.total,
        paid_date: new Date().toISOString().split('T')[0],
      })
      toast.success('Invoice marked as paid')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to mark as paid')
    }
  }

  async function handleExpand(invoice) {
    if (expandedId === invoice.id) {
      setExpandedId(null)
      return
    }
    const full = await fetchInvoice(invoice.id)
    if (full) {
      const idx = invoices.findIndex(i => i.id === invoice.id)
      if (idx !== -1) {
        invoices[idx] = { ...invoices[idx], pm_invoice_items: full.pm_invoice_items }
      }
      setExpandedId(invoice.id)
    }
  }

  function handleClose() {
    setShowForm(false)
    setEditingInv(null)
    setEditingItems([])
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-void-light border border-border rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Invoiced</p>
            <p className="text-lg font-semibold text-white font-mono">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Paid</p>
            <p className="text-lg font-semibold text-success font-mono">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Outstanding</p>
            <p className={`text-lg font-semibold font-mono ${outstanding > 0 ? 'text-warning' : 'text-success'}`}>
              {formatCurrency(outstanding)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Overdue</p>
            <p className={`text-lg font-semibold font-mono ${overdueCount > 0 ? 'text-danger' : 'text-white/60'}`}>
              {overdueCount}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create invoices to track billing, payments, and outstanding balances."
          action={{ label: 'New Invoice', onClick: handleNew }}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              expanded={expandedId === invoice.id}
              onExpand={() => handleExpand(invoice)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingInv ? 'Edit Invoice' : 'New Invoice'}
        size="lg"
      >
        <InvoiceForm
          initialData={editingInv}
          initialItems={editingItems}
          invoiceNumber={newInvNumber}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={saving}
          project={project}
        />
      </Modal>
    </div>
  )
}
