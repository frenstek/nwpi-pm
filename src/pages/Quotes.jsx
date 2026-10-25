import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Search, X, Trash2, ExternalLink, AlertTriangle,
  Clock, CheckCircle2, Send, ChevronDown, RefreshCw, Copy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { formatDate, cn } from '../lib/utils'
import { CATEGORIES } from '../data/estimatorConfig'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'neutral', icon: Clock },
  exported: { label: 'Exported', color: 'info', icon: CheckCircle2 },
  submitted: { label: 'Submitted', color: 'success', icon: Send },
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'exported', label: 'Exported' },
  { id: 'submitted', label: 'Submitted' },
]

export default function Quotes() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drafts?action=list')
      if (!res.ok) throw new Error('Failed to load')
      setQuotes(await res.json())
    } catch (err) {
      toast.error('Failed to load quotes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const filteredQuotes = useMemo(() => {
    let result = quotes
    if (activeTab !== 'all') {
      result = result.filter(q => q.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(quote =>
        (quote.client_name || '').toLowerCase().includes(q) ||
        (quote.site_address || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [quotes, activeTab, search])

  const tabCounts = useMemo(() => ({
    all: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    exported: quotes.filter(q => q.status === 'exported').length,
    submitted: quotes.filter(q => q.status === 'submitted').length,
  }), [quotes])

  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, updated_at: new Date().toISOString() } : q))
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setQuotes(prev => prev.filter(q => q.id !== deleteTarget.id))
      toast.success('Quote deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Failed to delete quote')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  function getProgress(quote) {
    const steps = quote.completed_steps
    if (!steps || !Array.isArray(steps)) return 0
    const total = CATEGORIES.length
    return Math.min(Math.round((steps.length / total) * 100), 100)
  }

  function openInEstimator(id) {
    localStorage.setItem('npi-load-draft-id', id)
    navigate('/estimator')
  }

  async function handleDuplicate(quote) {
    try {
      // Fetch full draft data
      const getRes = await fetch(`/api/drafts?action=get&id=${quote.id}`)
      if (!getRes.ok) throw new Error('Failed to load quote')
      const fullDraft = await getRes.json()

      // Clear client-specific fields but keep all selections
      const formData = { ...fullDraft.form_data }
      formData['client.clientName'] = ''
      formData['client.email'] = ''
      formData['client.mobile'] = ''
      formData['client.siteAddress'] = ''
      formData['client.lotNumber'] = ''
      formData['client.validUntil'] = ''

      // Create new draft with copied data
      const createRes = await fetch('/api/drafts?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: `Copy of ${quote.client_name || 'Untitled Quote'}`,
          site_address: '',
          form_data: formData,
          completed_steps: fullDraft.completed_steps || [],
          current_step: 0,
          last_category: fullDraft.last_category || '',
        }),
      })
      if (!createRes.ok) throw new Error('Failed to create copy')
      const newDraft = await createRes.json()

      toast.success('Quote duplicated')
      fetchQuotes()

      // Open the new draft in estimator
      localStorage.setItem('npi-load-draft-id', newDraft.id)
      navigate('/estimator')
    } catch (err) {
      toast.error('Failed to duplicate quote')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-amber" />
          <h1 className="text-xl font-display text-white">Quotes</h1>
        </div>
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-display text-white">Quotes</h1>
          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-white/[0.06] text-white/40 text-[10px] font-bold tabular-nums">
            {quotes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuotes}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button
            size="sm"
            onClick={() => navigate('/estimator')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Estimator
          </Button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-void-lighter/50 rounded-xl p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-amber/15 text-amber shadow-sm'
                  : 'text-white/40 hover:text-white/65 hover:bg-white/[0.04]'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-[10px] font-mono font-bold tabular-nums',
                activeTab === tab.id ? 'text-amber/60' : 'text-white/20'
              )}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or address..."
            className="w-full sm:w-64 rounded-lg border border-border bg-surface py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors pr-8"
            style={{ paddingLeft: '2.5rem' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes found"
          description={
            search.trim()
              ? 'Try a different search term.'
              : activeTab === 'all'
                ? 'Quotes created in the estimator will appear here.'
                : `No ${activeTab} quotes.`
          }
        />
      ) : (
        <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Site Address</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Last Category</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Created</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Updated</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredQuotes.map((quote, idx) => {
                  const statusCfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft
                  const progress = getProgress(quote)
                  return (
                    <tr
                      key={quote.id}
                      className={cn(
                        'hover:bg-white/[0.02] transition-colors group',
                        idx % 2 === 1 && 'bg-white/[0.01]'
                      )}
                    >
                      {/* Client Name */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {quote.client_name || 'Untitled'}
                        </p>
                      </td>

                      {/* Site Address */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-white/45 truncate max-w-[220px]">
                          {quote.site_address || '-'}
                        </p>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={quote.status || 'draft'}
                            onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                            disabled={updatingId === quote.id}
                            className={cn(
                              'appearance-none cursor-pointer rounded-full pl-3 pr-7 py-1 text-[11px] font-semibold border transition-all',
                              'focus:outline-none focus:ring-1 focus:ring-amber/30',
                              'bg-transparent',
                              quote.status === 'draft' && 'bg-white/[0.06] text-white/60 border-white/10',
                              quote.status === 'exported' && 'bg-info/10 text-info border-info/20',
                              quote.status === 'submitted' && 'bg-success/10 text-success border-success/20',
                              updatingId === quote.id && 'opacity-50'
                            )}
                          >
                            <option value="draft">Draft</option>
                            <option value="exported">Exported</option>
                            <option value="submitted">Submitted</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-white/30" />
                        </div>
                      </td>

                      {/* Last Category */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/40 truncate max-w-[150px]">
                          {quote.last_category || '-'}
                        </p>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                progress === 100 ? 'bg-success' : progress > 50 ? 'bg-amber' : 'bg-white/20'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-white/30 font-mono tabular-nums w-8">
                            {progress}%
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/35">
                          {quote.created_at ? formatDate(quote.created_at) : '-'}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/35">
                          {quote.updated_at ? formatDate(quote.updated_at) : '-'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openInEstimator(quote.id)}
                            className="p-1.5 rounded-lg text-white/20 hover:text-amber hover:bg-amber/10 transition-all cursor-pointer"
                            title="Open in Estimator"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(quote)}
                            className="p-1.5 rounded-lg text-white/20 hover:text-info hover:bg-info/10 transition-all cursor-pointer"
                            title="Duplicate quote"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(quote)}
                            className="p-1.5 rounded-lg text-white/20 hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
                            title="Delete quote"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quote" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white/70">
                Are you sure you want to delete the quote for{' '}
                <span className="font-semibold text-white">
                  "{deleteTarget?.client_name || 'Untitled'}"
                </span>?
              </p>
              <p className="text-xs text-white/40 mt-1">
                This will permanently remove this quote. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Quote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
