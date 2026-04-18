import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Shield, Pencil, Trash2, Clock, CheckCircle, XCircle, AlertTriangle, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWarranties } from '../../hooks/useWarranties'
import { WARRANTY_STATUSES, WARRANTY_PRIORITIES } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import WarrantyForm from './WarrantyForm'

const STATUS_ICONS = {
  submitted: Clock,
  in_progress: AlertTriangle,
  resolved: CheckCircle,
  rejected: XCircle,
}

export default function WarrantiesTab({ projectId }) {
  const {
    warranties, loading, fetchWarranties, createWarranty, updateWarranty, deleteWarranty,
  } = useWarranties()

  const [formModal, setFormModal] = useState({ open: false, warranty: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' })
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = useCallback(async () => {
    await fetchWarranties(projectId)
  }, [projectId, fetchWarranties])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredWarranties = useMemo(() => {
    if (statusFilter === 'all') return warranties
    return warranties.filter(w => w.status === statusFilter)
  }, [warranties, statusFilter])

  const counts = useMemo(() => {
    return {
      total: warranties.length,
      submitted: warranties.filter(w => w.status === 'submitted').length,
      in_progress: warranties.filter(w => w.status === 'in_progress').length,
      resolved: warranties.filter(w => w.status === 'resolved').length,
      rejected: warranties.filter(w => w.status === 'rejected').length,
    }
  }, [warranties])

  async function handleFormSubmit(data) {
    try {
      if (formModal.warranty) {
        await updateWarranty(formModal.warranty.id, data)
        toast.success('Warranty claim updated')
      } else {
        await createWarranty({ ...data, project_id: projectId })
        toast.success('Warranty claim submitted')
      }
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save warranty claim')
      throw err
    }
  }

  async function handleDelete() {
    try {
      await deleteWarranty(deleteConfirm.id)
      toast.success('Warranty claim deleted')
      setDeleteConfirm({ open: false, id: null, title: '' })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete warranty claim')
    }
  }

  async function handleQuickStatus(warrantyId, newStatus) {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'resolved') {
        updates.resolved_date = new Date().toISOString().split('T')[0]
      }
      await updateWarranty(warrantyId, updates)
      toast.success(`Updated to ${WARRANTY_STATUSES[newStatus].label}`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  if (loading && warranties.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-void-light border border-border rounded-xl p-5">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total</p>
            <p className="text-lg font-semibold text-white font-mono">{counts.total}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Submitted</p>
            <p className="text-lg font-semibold text-info font-mono">{counts.submitted}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">In Progress</p>
            <p className="text-lg font-semibold text-warning font-mono">{counts.in_progress}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Resolved</p>
            <p className="text-lg font-semibold text-success font-mono">{counts.resolved}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Rejected</p>
            <p className="text-lg font-semibold text-danger font-mono">{counts.rejected}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Warranty Claims</h3>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-white focus:outline-none focus:border-amber appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {Object.entries(WARRANTY_STATUSES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Button size="sm" onClick={() => setFormModal({ open: true, warranty: null })}>
          <Plus className="h-3.5 w-3.5" />
          New Claim
        </Button>
      </div>

      {/* Claims List */}
      {filteredWarranties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-surface mb-3">
            <Shield className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-sm text-white/40 mb-1">No warranty claims</p>
          <p className="text-xs text-white/25 mb-4">Submit warranty claims for defects found after handover</p>
          <Button size="sm" onClick={() => setFormModal({ open: true, warranty: null })}>
            <Plus className="h-3.5 w-3.5" />
            New Claim
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWarranties.map(w => {
            const statusCfg = WARRANTY_STATUSES[w.status] || WARRANTY_STATUSES.submitted
            const priorityCfg = WARRANTY_PRIORITIES[w.priority] || WARRANTY_PRIORITIES.normal
            const StatusIcon = STATUS_ICONS[w.status] || Clock

            return (
              <div
                key={w.id}
                className="bg-void-light border border-border rounded-xl p-4 hover:border-border-light transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${
                      statusCfg.color === 'info' ? 'bg-info/15 text-info' :
                      statusCfg.color === 'warning' ? 'bg-warning/15 text-warning' :
                      statusCfg.color === 'success' ? 'bg-success/15 text-success' :
                      'bg-danger/15 text-danger'
                    }`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-white">{w.title}</h4>
                        <Badge variant={statusCfg.color}>{statusCfg.label}</Badge>
                        <Badge variant={priorityCfg.color}>{priorityCfg.label}</Badge>
                      </div>
                      {w.description && (
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{w.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setFormModal({ open: true, warranty: w })}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, id: w.id, title: w.title })}
                      className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-white/40 ml-11">
                  <span className="capitalize">{w.category}</span>
                  {w.submitted_by && <span>By: <span className="text-white/60">{w.submitted_by}</span></span>}
                  {w.assigned_to && <span>Assigned: <span className="text-white/60">{w.assigned_to}</span></span>}
                  {w.submitted_date && <span>Submitted: {formatDate(w.submitted_date)}</span>}
                  {w.resolved_date && <span>Resolved: {formatDate(w.resolved_date)}</span>}
                </div>

                {w.resolution_notes && (
                  <div className="ml-11 mt-2 p-2 bg-surface/50 rounded-lg">
                    <p className="text-xs text-white/50">
                      <span className="font-medium text-white/60">Resolution:</span> {w.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Quick status buttons */}
                {w.status !== 'resolved' && w.status !== 'rejected' && (
                  <div className="flex items-center gap-2 mt-3 ml-11">
                    {w.status === 'submitted' && (
                      <button
                        onClick={() => handleQuickStatus(w.id, 'in_progress')}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-border text-white/40 hover:text-white hover:border-border-light transition-colors cursor-pointer"
                      >
                        Start Work
                      </button>
                    )}
                    <button
                      onClick={() => handleQuickStatus(w.id, 'resolved')}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-success/30 text-success/70 hover:text-success hover:border-success/50 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Resolve
                    </button>
                    <button
                      onClick={() => handleQuickStatus(w.id, 'rejected')}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-danger/30 text-danger/70 hover:text-danger hover:border-danger/50 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <WarrantyForm
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, warranty: null })}
        onSubmit={handleFormSubmit}
        warranty={formModal.warranty}
      />

      {/* Delete Confirm */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })} />
          <div className="relative w-full max-w-sm bg-void-light border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Delete warranty claim?</h3>
            <p className="text-sm text-white/50 mb-4">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.title}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
