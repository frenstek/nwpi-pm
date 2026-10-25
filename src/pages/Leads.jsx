import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  UserPlus, Plus, List, Columns3, Phone, Mail, DollarSign,
  CalendarDays, Pencil, Trash2, ArrowRight, Filter, ChevronRight,
  Briefcase, Trophy, XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useLeads } from '../hooks/useLeads'
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_PIPELINE } from '../lib/constants'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'extension', label: 'Extension' },
  { value: 'fitout', label: 'Fit-out' },
  { value: 'other', label: 'Other' },
]

const columnColors = {
  new: 'bg-info',
  contacted: 'bg-amber',
  qualified: 'bg-warning',
  proposal_sent: 'bg-purple-500',
  negotiation: 'bg-success',
}

export default function Leads() {
  const {
    leads, loading, fetchLeads, createLead, updateLead, deleteLead, convertToProject,
  } = useLeads()

  const [view, setView] = useState('pipeline')
  const [formModal, setFormModal] = useState({ open: false, lead: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })
  const [convertConfirm, setConvertConfirm] = useState({ open: false, id: null, name: '' })
  const [listFilter, setListFilter] = useState('all')

  const loadData = useCallback(async () => {
    await fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Pipeline columns
  const pipelineData = useMemo(() => {
    const columns = {}
    LEAD_PIPELINE.forEach(status => {
      columns[status] = leads.filter(l => l.status === status)
    })
    // Also add won and lost as collapsed info
    columns.won = leads.filter(l => l.status === 'won')
    columns.lost = leads.filter(l => l.status === 'lost')
    return columns
  }, [leads])

  // List data
  const listData = useMemo(() => {
    if (listFilter === 'all') return leads
    return leads.filter(l => l.status === listFilter)
  }, [leads, listFilter])

  async function handleFormSubmit(data) {
    try {
      if (formModal.lead) {
        await updateLead(formModal.lead.id, data)
        toast.success('Lead updated')
      } else {
        await createLead(data)
        toast.success('Lead created')
      }
      setFormModal({ open: false, lead: null })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save lead')
    }
  }

  async function handleDelete() {
    try {
      await deleteLead(deleteConfirm.id)
      toast.success('Lead deleted')
      setDeleteConfirm({ open: false, id: null, name: '' })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead')
    }
  }

  async function handleConvert() {
    try {
      const project = await convertToProject(convertConfirm.id)
      toast.success(`Converted to project: ${project.name}`)
      setConvertConfirm({ open: false, id: null, name: '' })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to convert lead')
    }
  }

  async function handleQuickMoveNext(lead) {
    const pipeline = LEAD_PIPELINE
    const idx = pipeline.indexOf(lead.status)
    if (idx < 0 || idx >= pipeline.length - 1) return
    const nextStatus = pipeline[idx + 1]
    try {
      await updateLead(lead.id, { status: nextStatus })
      toast.success(`Moved to ${LEAD_STATUSES[nextStatus].label}`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update lead')
    }
  }

  if (loading && leads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserPlus className="h-6 w-6 text-amber" />
          <h1 className="text-xl font-display text-white">Leads</h1>
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-display text-white">Leads</h1>
          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-white/[0.06] text-white/40 text-[10px] font-bold tabular-nums">
            {leads.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('pipeline')}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                view === 'pipeline' ? 'bg-amber/10 text-amber' : 'text-white/35 hover:text-white/60'
              )}
            >
              <Columns3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-all cursor-pointer border-l border-border',
                view === 'list' ? 'bg-amber/10 text-amber' : 'text-white/35 hover:text-white/60'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setFormModal({ open: true, lead: null })}>
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div className="space-y-5">
          {/* Active Pipeline */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {LEAD_PIPELINE.map(status => {
              const cfg = LEAD_STATUSES[status]
              const columnLeads = pipelineData[status] || []
              const topColor = columnColors[status] || 'bg-border'
              return (
                <div key={status} className="min-w-[260px] w-[260px] shrink-0">
                  <div className="bg-void-lighter/50 rounded-xl border border-white/[0.04] overflow-hidden">
                    {/* Colored top gradient band */}
                    <div className={cn('h-[3px]', topColor)} />
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={cfg.color}>{cfg.label}</Badge>
                        <span className="text-[10px] text-white/25 font-mono font-bold">{columnLeads.length}</span>
                      </div>
                    </div>
                    <div className="space-y-2 p-2 pt-0 min-h-[80px]">
                      {columnLeads.length === 0 ? (
                        <div className="border border-dashed border-white/[0.06] rounded-lg p-4 text-center">
                          <p className="text-[11px] text-white/15">No leads</p>
                        </div>
                      ) : (
                        columnLeads.map(lead => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={() => setFormModal({ open: true, lead })}
                            onDelete={() => setDeleteConfirm({ open: true, id: lead.id, name: lead.name })}
                            onMoveNext={() => handleQuickMoveNext(lead)}
                            onConvert={() => setConvertConfirm({ open: true, id: lead.id, name: lead.name })}
                            showMoveNext={LEAD_PIPELINE.indexOf(status) < LEAD_PIPELINE.length - 1}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Won/Lost Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-void-light border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-success/10">
                  <Trophy className="h-3.5 w-3.5 text-success" />
                </div>
                <h3 className="text-sm font-semibold text-white">Won</h3>
                <span className="text-[10px] text-white/25 font-mono font-bold">{pipelineData.won?.length || 0}</span>
              </div>
              {(pipelineData.won || []).length === 0 ? (
                <p className="text-xs text-white/20">No won leads yet</p>
              ) : (
                <div className="space-y-2">
                  {pipelineData.won.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs">
                      <span className="text-white/50 truncate">{l.name}</span>
                      <span className="text-success font-mono tabular-nums">{formatCurrency(l.estimated_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-void-light border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-danger/10">
                  <XCircle className="h-3.5 w-3.5 text-danger" />
                </div>
                <h3 className="text-sm font-semibold text-white">Lost</h3>
                <span className="text-[10px] text-white/25 font-mono font-bold">{pipelineData.lost?.length || 0}</span>
              </div>
              {(pipelineData.lost || []).length === 0 ? (
                <p className="text-xs text-white/20">No lost leads yet</p>
              ) : (
                <div className="space-y-2">
                  {pipelineData.lost.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs">
                      <span className="text-white/50 truncate">{l.name}</span>
                      <span className="text-danger font-mono tabular-nums">{formatCurrency(l.estimated_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="pl-8 pr-8"
              >
                <option value="all">All Statuses</option>
                {Object.entries(LEAD_STATUSES).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Source</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Phone</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Est. Value</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Follow-up</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {listData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/25">
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    listData.map((lead, idx) => {
                      const statusCfg = LEAD_STATUSES[lead.status] || LEAD_STATUSES.new
                      const sourceCfg = LEAD_SOURCES.find(s => s.value === lead.source)
                      return (
                        <tr key={lead.id} className={cn(
                          'hover:bg-white/[0.02] transition-colors group',
                          idx % 2 === 1 && 'bg-white/[0.01]'
                        )}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{lead.name}</p>
                            {lead.email && <p className="text-xs text-white/30">{lead.email}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusCfg.color}>{statusCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/45">{sourceCfg?.label || lead.source}</td>
                          <td className="px-4 py-3 text-sm text-white/50">{lead.phone || '-'}</td>
                          <td className="px-4 py-3 text-right text-sm text-amber font-mono tabular-nums">
                            {lead.estimated_value ? formatCurrency(lead.estimated_value) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/45">
                            {lead.next_follow_up ? formatDate(lead.next_follow_up) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setFormModal({ open: true, lead })}
                                className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ open: true, id: lead.id, name: lead.name })}
                                className="p-1.5 rounded-lg text-white/20 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, lead: null })}
        onSubmit={handleFormSubmit}
        lead={formModal.lead}
      />

      {/* Delete Confirm */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })} />
          <div className="relative w-full max-w-sm bg-void-light border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-6 animate-modal-in">
            <h3 className="text-base font-semibold text-white mb-2">Delete lead?</h3>
            <p className="text-sm text-white/45 mb-5">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.name}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Confirm */}
      {convertConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setConvertConfirm({ open: false, id: null, name: '' })} />
          <div className="relative w-full max-w-sm bg-void-light border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 p-6 animate-modal-in">
            <h3 className="text-base font-semibold text-white mb-2">Convert to project?</h3>
            <p className="text-sm text-white/45 mb-5">
              This will create a new project from <span className="text-white font-medium">"{convertConfirm.name}"</span> and mark this lead as Won.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConvertConfirm({ open: false, id: null, name: '' })}>Cancel</Button>
              <Button size="sm" onClick={handleConvert}>
                <Briefcase className="h-3.5 w-3.5" />
                Convert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// LEAD CARD (Pipeline View)
// ============================================================
function LeadCard({ lead, onEdit, onDelete, onMoveNext, onConvert, showMoveNext }) {
  const sourceCfg = LEAD_SOURCES.find(s => s.value === lead.source)
  const isOverdue = lead.next_follow_up && new Date(lead.next_follow_up) < new Date(new Date().toDateString())

  return (
    <div className="bg-void-light border border-white/[0.06] rounded-lg p-3 hover:border-white/[0.12] hover:shadow-md hover:shadow-black/20 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white truncate">{lead.name}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-1 rounded text-white/15 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-white/15 hover:text-danger transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-white/35">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.estimated_value > 0 && (
          <div className="flex items-center gap-1.5 text-amber">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span className="font-mono tabular-nums">{formatCurrency(lead.estimated_value)}</span>
          </div>
        )}
        {sourceCfg && (
          <Badge variant="neutral" className="text-[10px]">{sourceCfg.label}</Badge>
        )}
        {lead.next_follow_up && (
          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-danger' : 'text-white/25'}`}>
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{formatDate(lead.next_follow_up)}</span>
            {isOverdue && <span className="text-[10px] font-semibold">Overdue</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/[0.04]">
        {showMoveNext && (
          <button
            onClick={onMoveNext}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-white/[0.06] text-white/35 hover:text-white hover:border-white/[0.12] transition-all cursor-pointer"
          >
            <ChevronRight className="h-3 w-3" />
            Next Stage
          </button>
        )}
        {lead.status === 'negotiation' && (
          <button
            onClick={onConvert}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-success/20 text-success/60 hover:text-success hover:border-success/40 transition-all cursor-pointer"
          >
            <Briefcase className="h-3 w-3" />
            Convert
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// LEAD FORM MODAL
// ============================================================
function LeadFormModal({ isOpen, onClose, onSubmit, lead }) {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', source: 'website', status: 'new',
    project_type: '', estimated_value: '', address: '', suburb: '',
    notes: '', next_follow_up: '', assigned_to: '',
  })
  const [saving, setSaving] = useState(false)
  const isEdit = !!lead

  useEffect(() => {
    if (isOpen) {
      if (lead) {
        setFormData({
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          source: lead.source || 'website',
          status: lead.status || 'new',
          project_type: lead.project_type || '',
          estimated_value: lead.estimated_value?.toString() || '',
          address: lead.address || '',
          suburb: lead.suburb || '',
          notes: lead.notes || '',
          next_follow_up: lead.next_follow_up || '',
          assigned_to: lead.assigned_to || '',
        })
      } else {
        setFormData({
          name: '', email: '', phone: '', source: 'website', status: 'new',
          project_type: '', estimated_value: '', address: '', suburb: '',
          notes: '', next_follow_up: '', assigned_to: '',
        })
      }
    }
  }, [isOpen, lead])

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        source: formData.source,
        status: formData.status,
        project_type: formData.project_type || null,
        estimated_value: parseFloat(formData.estimated_value) || null,
        address: formData.address.trim() || null,
        suburb: formData.suburb.trim() || null,
        notes: formData.notes.trim() || null,
        next_follow_up: formData.next_follow_up || null,
        assigned_to: formData.assigned_to.trim() || null,
      })
    } catch (err) {
      // handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Lead' : 'Add Lead'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/50 mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Lead name"
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="04xx xxx xxx"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Source</label>
            <select
              value={formData.source}
              onChange={e => handleChange('source', e.target.value)}
              className="w-full"
            >
              {LEAD_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full"
            >
              {Object.entries(LEAD_STATUSES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Project Type</label>
            <select
              value={formData.project_type}
              onChange={e => handleChange('project_type', e.target.value)}
              className="w-full"
            >
              <option value="">Select type...</option>
              {PROJECT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Estimated Value (AUD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/25">$</span>
              <input
                type="number"
                value={formData.estimated_value}
                onChange={e => handleChange('estimated_value', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full pl-7"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Street address"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Suburb</label>
            <input
              type="text"
              value={formData.suburb}
              onChange={e => handleChange('suburb', e.target.value)}
              placeholder="Suburb"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Next Follow-up</label>
            <input
              type="date"
              value={formData.next_follow_up}
              onChange={e => handleChange('next_follow_up', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={e => handleChange('assigned_to', e.target.value)}
              placeholder="Team member"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            className="w-full resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving} disabled={!formData.name.trim()}>
            {isEdit ? 'Save Changes' : 'Add Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
