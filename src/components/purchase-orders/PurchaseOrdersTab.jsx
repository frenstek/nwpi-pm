import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Package, Pencil, Trash2, ChevronDown, ChevronRight,
  Send, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { PO_STATUSES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import PurchaseOrderForm from './PurchaseOrderForm'

function POCard({ po, onEdit, onDelete, onStatusChange, onExpand, expanded }) {
  const statusConfig = PO_STATUSES[po.status] || PO_STATUSES.draft

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
          <span className="text-xs font-mono font-semibold text-amber shrink-0">{po.po_number}</span>
          <span className="text-sm font-semibold text-white truncate">{po.vendor_name}</span>
          <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm font-mono font-semibold text-white hidden sm:block">
            {formatCurrency(po.total)}
          </span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {(po.status === 'draft' || po.status === 'sent') && (
              <button
                onClick={() => onEdit(po)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {po.status === 'draft' && (
              <button
                onClick={() => onDelete(po)}
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
            {po.description && (
              <div className="w-full">
                <p className="text-white/60 text-sm">{po.description}</p>
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              {po.vendor_contact && <span>Contact: {po.vendor_contact}</span>}
              {po.vendor_email && <span>Email: {po.vendor_email}</span>}
              {po.issue_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Issued: {formatDate(po.issue_date)}
                </span>
              )}
              {po.due_date && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Due: {formatDate(po.due_date)}
                </span>
              )}
              <span>{po.items_count} item{po.items_count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Line Items */}
          {po.pm_po_items && po.pm_po_items.length > 0 && (
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white/30 bg-surface/30">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              <div className="divide-y divide-border/50">
                {po.pm_po_items.map(item => (
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
                  <span className="font-mono">${Number(po.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>GST (10%)</span>
                  <span className="font-mono">${Number(po.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-amber mt-1">
                  <span>Total</span>
                  <span className="font-mono">${Number(po.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {po.notes && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-1">Notes</p>
              <p className="text-sm text-white/50 whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="flex items-center gap-2 pt-1">
            {po.status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange(po, 'sent')}>
                <Send className="h-3.5 w-3.5" />
                Mark as Sent
              </Button>
            )}
            {po.status === 'sent' && (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange(po, 'acknowledged')}>
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Acknowledged
              </Button>
            )}
            {po.status === 'acknowledged' && (
              <Button size="sm" onClick={() => onStatusChange(po, 'completed')}>
                <CheckCircle className="h-3.5 w-3.5" />
                Mark Completed
              </Button>
            )}
            {po.status !== 'cancelled' && po.status !== 'completed' && (
              <Button size="sm" variant="danger" onClick={() => onStatusChange(po, 'cancelled')}>
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

export default function PurchaseOrdersTab({ projectId }) {
  const {
    purchaseOrders, loading,
    fetchPurchaseOrders, fetchPurchaseOrder, generatePONumber,
    createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    createPOItem, updatePOItem, deletePOItem,
  } = usePurchaseOrders()

  const [showForm, setShowForm] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [editingItems, setEditingItems] = useState([])
  const [newPONumber, setNewPONumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const loadData = useCallback(async () => {
    await fetchPurchaseOrders(projectId)
  }, [projectId, fetchPurchaseOrders])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute summary
  const totalPOs = purchaseOrders.length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + (Number(po.total) || 0), 0)
  const pendingValue = purchaseOrders
    .filter(po => po.status !== 'completed' && po.status !== 'cancelled')
    .reduce((sum, po) => sum + (Number(po.total) || 0), 0)

  async function handleNew() {
    const num = await generatePONumber(projectId)
    setNewPONumber(num)
    setEditingPO(null)
    setEditingItems([])
    setShowForm(true)
  }

  async function handleEdit(po) {
    const full = await fetchPurchaseOrder(po.id)
    if (full) {
      setEditingPO(full)
      setEditingItems(full.pm_po_items || [])
      setNewPONumber('')
      setShowForm(true)
    }
  }

  async function handleSubmit(formData, items) {
    setSaving(true)
    try {
      if (editingPO) {
        // Update PO
        await updatePurchaseOrder(editingPO.id, formData)

        // Sync items: delete removed, update existing, create new
        const existingIds = items.filter(it => it.id).map(it => it.id)
        const oldItems = editingItems || []

        // Delete items that were removed
        for (const old of oldItems) {
          if (!existingIds.includes(old.id)) {
            await deletePOItem(old.id)
          }
        }

        // Update or create items
        for (const item of items) {
          if (item.id) {
            await updatePOItem(item.id, {
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              sort_order: item.sort_order,
            })
          } else {
            await createPOItem({
              po_id: editingPO.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              sort_order: item.sort_order,
            })
          }
        }

        toast.success('Purchase order updated')
      } else {
        // Create PO
        const po = await createPurchaseOrder({
          ...formData,
          project_id: projectId,
        })

        // Create items
        for (const item of items) {
          await createPOItem({
            po_id: po.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            sort_order: item.sort_order,
          })
        }

        toast.success('Purchase order created')
      }

      setShowForm(false)
      setEditingPO(null)
      setEditingItems([])
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save purchase order')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(po) {
    if (!confirm(`Delete purchase order "${po.po_number}"?`)) return
    try {
      await deletePurchaseOrder(po.id)
      toast.success('Purchase order deleted')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete purchase order')
    }
  }

  async function handleStatusChange(po, newStatus) {
    try {
      await updatePurchaseOrder(po.id, { status: newStatus })
      toast.success(`Purchase order marked as ${newStatus}`)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  async function handleExpand(po) {
    if (expandedId === po.id) {
      setExpandedId(null)
      return
    }
    // Fetch full PO with items
    const full = await fetchPurchaseOrder(po.id)
    if (full) {
      // Update the PO in the list with full item data
      const idx = purchaseOrders.findIndex(p => p.id === po.id)
      if (idx !== -1) {
        purchaseOrders[idx] = { ...purchaseOrders[idx], pm_po_items: full.pm_po_items }
      }
      setExpandedId(po.id)
    }
  }

  function handleClose() {
    setShowForm(false)
    setEditingPO(null)
    setEditingItems([])
  }

  if (loading && purchaseOrders.length === 0) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Purchase Orders</p>
            <p className="text-lg font-semibold text-white font-mono">{totalPOs}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Value</p>
            <p className="text-lg font-semibold text-white font-mono">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Pending Value</p>
            <p className="text-lg font-semibold text-warning font-mono">{formatCurrency(pendingValue)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {totalPOs} purchase order{totalPOs !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {/* PO List */}
      {purchaseOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No purchase orders yet"
          description="Create purchase orders to track vendor orders, materials, and costs."
          action={{ label: 'New Purchase Order', onClick: handleNew }}
        />
      ) : (
        <div className="space-y-3">
          {purchaseOrders.map(po => (
            <POCard
              key={po.id}
              po={po}
              expanded={expandedId === po.id}
              onExpand={() => handleExpand(po)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
        size="lg"
      >
        <PurchaseOrderForm
          initialData={editingPO}
          initialItems={editingItems}
          poNumber={newPONumber}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
