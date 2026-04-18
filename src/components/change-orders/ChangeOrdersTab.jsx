import { useState, useEffect } from 'react'
import {
  Plus, FileEdit, Pencil, Trash2, Send, CheckCircle, XCircle, DollarSign, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useChangeOrders } from '../../hooks/useChangeOrders'
import { CHANGE_ORDER_STATUSES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import ChangeOrderForm from './ChangeOrderForm'

function ChangeOrderCard({ order, index, onEdit, onDelete, onSubmitForApproval, onApprove, onReject, onComplete }) {
  const statusConfig = CHANGE_ORDER_STATUSES[order.status] || CHANGE_ORDER_STATUSES.draft
  const coNumber = `CO-${String(index + 1).padStart(3, '0')}`
  const canEdit = order.status === 'draft' || order.status === 'pending'
  const canDelete = order.status === 'draft' || order.status === 'pending'

  return (
    <div className="bg-void-light border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-semibold text-amber shrink-0">{coNumber}</span>
          <span className="text-sm font-semibold text-white truncate">{order.title}</span>
          <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <button
              onClick={() => onEdit(order)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(order)}
              className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Amount */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber" />
          <span className="text-lg font-semibold font-mono text-white">{formatCurrency(order.amount)}</span>
        </div>

        {/* Description */}
        {order.description && (
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Description</p>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{order.description}</p>
          </div>
        )}

        {/* Reason */}
        {order.reason && (
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Reason for Change</p>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{order.reason}</p>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Notes</p>
            <p className="text-sm text-white/50 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Dates & Approved By */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
          {order.submitted_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Submitted: {formatDate(order.submitted_at)}</span>
            </div>
          )}
          {order.approved_at && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Approved: {formatDate(order.approved_at)}</span>
            </div>
          )}
          {order.approved_by && (
            <span>By: {order.approved_by}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {order.status === 'draft' && (
            <Button size="sm" variant="secondary" onClick={() => onSubmitForApproval(order)}>
              <Send className="h-3.5 w-3.5" />
              Submit for Approval
            </Button>
          )}
          {order.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => onApprove(order)}>
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => onReject(order)}>
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
          {order.status === 'approved' && (
            <Button size="sm" variant="secondary" onClick={() => onComplete(order)}>
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Completed
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChangeOrdersTab({ projectId }) {
  const {
    changeOrders, loading, fetchChangeOrders,
    createChangeOrder, updateChangeOrder, deleteChangeOrder,
  } = useChangeOrders()
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchChangeOrders(projectId)
  }, [projectId, fetchChangeOrders])

  // Compute summary — use chronological order for CO numbering
  const ordersChronological = [...changeOrders].reverse()
  const totalCount = changeOrders.length
  const totalApproved = changeOrders
    .filter(co => co.status === 'approved' || co.status === 'completed')
    .reduce((sum, co) => sum + (co.amount || 0), 0)
  const totalPending = changeOrders
    .filter(co => co.status === 'pending')
    .reduce((sum, co) => sum + (co.amount || 0), 0)

  async function handleSubmit(formData) {
    setSaving(true)
    try {
      if (editingOrder) {
        await updateChangeOrder(editingOrder.id, formData)
        toast.success('Change order updated')
      } else {
        await createChangeOrder({ ...formData, project_id: projectId })
        toast.success('Change order created')
      }
      setShowForm(false)
      setEditingOrder(null)
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to save change order')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(order) {
    setEditingOrder(order)
    setShowForm(true)
  }

  async function handleDelete(order) {
    if (!confirm(`Delete change order "${order.title}"?`)) return
    try {
      await deleteChangeOrder(order.id)
      toast.success('Change order deleted')
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to delete change order')
    }
  }

  async function handleSubmitForApproval(order) {
    try {
      await updateChangeOrder(order.id, {
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      toast.success('Change order submitted for approval')
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to submit change order')
    }
  }

  async function handleApprove(order) {
    const approvedBy = prompt('Approved by (name):')
    if (approvedBy === null) return
    try {
      await updateChangeOrder(order.id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy.trim() || 'Unknown',
      })
      toast.success('Change order approved')
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to approve change order')
    }
  }

  async function handleReject(order) {
    try {
      await updateChangeOrder(order.id, { status: 'rejected' })
      toast.success('Change order rejected')
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to reject change order')
    }
  }

  async function handleComplete(order) {
    try {
      await updateChangeOrder(order.id, { status: 'completed' })
      toast.success('Change order marked as completed')
      fetchChangeOrders(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to complete change order')
    }
  }

  function handleClose() {
    setShowForm(false)
    setEditingOrder(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  // Build a map from order id to its chronological index for CO numbering
  const orderIndexMap = new Map()
  ordersChronological.forEach((co, i) => {
    orderIndexMap.set(co.id, i)
  })

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-void-light border border-border rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Change Orders</p>
            <p className="text-lg font-semibold text-white font-mono">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Approved Amount</p>
            <p className="text-lg font-semibold text-success font-mono">{formatCurrency(totalApproved)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Pending Amount</p>
            <p className="text-lg font-semibold text-warning font-mono">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {totalCount} change order{totalCount !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          New Change Order
        </Button>
      </div>

      {/* Change Order Cards */}
      {changeOrders.length === 0 ? (
        <EmptyState
          icon={FileEdit}
          title="No change orders yet"
          description="Track post-contract scope changes with pricing and approval workflow."
          action={{ label: 'New Change Order', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {changeOrders.map(order => (
            <ChangeOrderCard
              key={order.id}
              order={order}
              index={orderIndexMap.get(order.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSubmitForApproval={handleSubmitForApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingOrder ? 'Edit Change Order' : 'New Change Order'}
        size="lg"
      >
        <ChangeOrderForm
          initialData={editingOrder}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
