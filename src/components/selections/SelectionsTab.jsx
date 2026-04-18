import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Pencil, Trash2,
  Palette, CheckSquare, Package, Truck, AlertTriangle,
  CalendarDays, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelections } from '../../hooks/useSelections'
import { SELECTION_STATUSES, SELECTION_CATEGORIES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import SelectionForm from './SelectionForm'

const STATUS_FLOW = ['pending', 'selected', 'ordered', 'installed']

function getNextStatuses(currentStatus) {
  const idx = STATUS_FLOW.indexOf(currentStatus)
  if (idx === -1) return STATUS_FLOW.slice(1)
  return STATUS_FLOW.slice(idx + 1)
}

function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export default function SelectionsTab({ projectId }) {
  const {
    selections,
    loading,
    fetchSelections,
    createSelection,
    updateSelection,
    deleteSelection,
  } = useSelections()

  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [formModal, setFormModal] = useState({ open: false, selection: null, defaultCategory: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loadData = useCallback(async () => {
    await fetchSelections(projectId)
  }, [projectId, fetchSelections])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute counts
  const counts = useMemo(() => {
    const c = { total: selections.length, pending: 0, selected: 0, ordered: 0, installed: 0 }
    selections.forEach((s) => {
      if (c[s.status] !== undefined) c[s.status]++
    })
    return c
  }, [selections])

  // Filter selections
  const filteredSelections = useMemo(() => {
    if (categoryFilter === 'all') return selections
    return selections.filter((s) => s.category === categoryFilter)
  }, [selections, categoryFilter])

  // Group by category
  const grouped = useMemo(() => {
    const map = {}
    filteredSelections.forEach((s) => {
      if (!map[s.category]) map[s.category] = []
      map[s.category].push(s)
    })
    // Sort categories by SELECTION_CATEGORIES order
    const ordered = {}
    SELECTION_CATEGORIES.forEach((cat) => {
      if (map[cat]) ordered[cat] = map[cat]
    })
    // Any categories not in the predefined list
    Object.keys(map).forEach((cat) => {
      if (!ordered[cat]) ordered[cat] = map[cat]
    })
    return ordered
  }, [filteredSelections])

  // Categories that have selections (for filter dropdown)
  const activeCategories = useMemo(() => {
    return [...new Set(selections.map((s) => s.category))]
  }, [selections])

  function toggleCategory(cat) {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Form actions
  function openAddSelection(category) {
    setFormModal({ open: false, selection: null, defaultCategory: category || null })
    // Small delay to reset modal state properly when switching
    setTimeout(() => {
      setFormModal({ open: true, selection: null, defaultCategory: category || null })
    }, 0)
  }

  function openEditSelection(selection) {
    setFormModal({ open: true, selection, defaultCategory: null })
  }

  async function handleFormSubmit(data) {
    try {
      if (formModal.selection) {
        await updateSelection(formModal.selection.id, data)
        toast.success('Selection updated')
      } else {
        await createSelection({ ...data, project_id: projectId })
        toast.success('Selection added')
      }
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save selection')
      throw err
    }
  }

  // Quick status update
  async function handleQuickStatus(selectionId, newStatus) {
    try {
      await updateSelection(selectionId, { status: newStatus })
      toast.success(`Marked as ${SELECTION_STATUSES[newStatus].label}`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  // Delete
  function confirmDelete(id, name) {
    setDeleteConfirm({ open: true, id, name })
  }

  async function handleDelete() {
    try {
      await deleteSelection(deleteConfirm.id)
      toast.success('Selection deleted')
      setDeleteConfirm({ open: false, id: null, name: '' })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete selection')
    }
  }

  // Total cost
  const totalCost = useMemo(() => {
    return selections.reduce((sum, s) => sum + (s.cost || 0), 0)
  }, [selections])

  if (loading && selections.length === 0) {
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total</p>
            <p className="text-lg font-semibold text-white font-mono">{counts.total}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Pending</p>
            <p className="text-lg font-semibold text-white/60 font-mono">{counts.pending}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Selected</p>
            <p className="text-lg font-semibold text-amber font-mono">{counts.selected}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Ordered</p>
            <p className="text-lg font-semibold text-info font-mono">{counts.ordered}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Installed</p>
            <p className="text-lg font-semibold text-success font-mono">{counts.installed}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Cost</p>
            <p className="text-lg font-semibold text-amber font-mono">{formatCurrency(totalCost)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {counts.total > 0 && (
          <div className="mt-4">
            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden flex">
              {counts.installed > 0 && (
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${(counts.installed / counts.total) * 100}%` }}
                />
              )}
              {counts.ordered > 0 && (
                <div
                  className="h-full bg-info transition-all duration-500"
                  style={{ width: `${(counts.ordered / counts.total) * 100}%` }}
                />
              )}
              {counts.selected > 0 && (
                <div
                  className="h-full bg-amber transition-all duration-500"
                  style={{ width: `${(counts.selected / counts.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                <span className="h-2 w-2 rounded-full bg-success" /> Installed
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                <span className="h-2 w-2 rounded-full bg-info" /> Ordered
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                <span className="h-2 w-2 rounded-full bg-amber" /> Selected
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/30">
                <span className="h-2 w-2 rounded-full bg-surface" /> Pending
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Selections</h3>
          {activeCategories.length > 1 && (
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-white focus:outline-none focus:border-amber appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {activeCategories
                  .sort((a, b) => SELECTION_CATEGORIES.indexOf(a) - SELECTION_CATEGORIES.indexOf(b))
                  .map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
        <Button size="sm" onClick={() => openAddSelection(null)}>
          <Plus className="h-3.5 w-3.5" />
          Add Selection
        </Button>
      </div>

      {/* Selections by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-surface mb-3">
            <Palette className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-sm text-white/40 mb-1">No selections yet</p>
          <p className="text-xs text-white/25 mb-4">Add selections to track client finish choices</p>
          <Button size="sm" onClick={() => openAddSelection(null)}>
            <Plus className="h-3.5 w-3.5" />
            Add Selection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, items]) => {
            const isCollapsed = collapsedCategories[category]
            const catCost = items.reduce((sum, s) => sum + (s.cost || 0), 0)
            const catInstalled = items.filter((s) => s.status === 'installed').length
            const catPending = items.filter((s) => s.status === 'pending').length

            return (
              <div
                key={category}
                className="bg-void-light border border-border rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <button className="text-white/40 hover:text-white transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{category}</span>
                      <span className="text-xs text-white/30">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-5 text-xs font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-white/40 mr-1.5">Cost:</span>
                      <span className="text-white">{formatCurrency(catCost)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-success">{catInstalled}/{items.length} installed</span>
                    </div>
                    {catPending > 0 && (
                      <span className="text-amber">{catPending} pending</span>
                    )}
                  </div>
                </div>

                {/* Mobile category stats */}
                {!isCollapsed && (
                  <div className="flex sm:hidden items-center gap-4 px-4 pb-2 text-xs font-mono">
                    <span className="text-white/40">Cost: <span className="text-white">{formatCurrency(catCost)}</span></span>
                    <span className="text-success">{catInstalled}/{items.length} installed</span>
                    {catPending > 0 && <span className="text-amber">{catPending} pending</span>}
                  </div>
                )}

                {/* Items */}
                {!isCollapsed && (
                  <div className="border-t border-border">
                    <div className="divide-y divide-border/50">
                      {items.map((item) => {
                        const statusConfig = SELECTION_STATUSES[item.status] || SELECTION_STATUSES.pending
                        const overdue = isOverdue(item.due_date) && item.status !== 'installed'
                        const nextStatuses = getNextStatuses(item.status)

                        return (
                          <div
                            key={item.id}
                            className="px-4 py-3 hover:bg-surface/30 transition-colors group"
                          >
                            {/* Top row: name, status, actions */}
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-white">{item.item_name}</span>
                                  <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                                  {overdue && (
                                    <span className="flex items-center gap-1 text-[10px] text-danger font-medium">
                                      <AlertTriangle className="h-3 w-3" />
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                {item.selected_option && (
                                  <p className="text-xs text-amber/80 mt-0.5">{item.selected_option}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openEditSelection(item)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(item.id, item.item_name)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Detail row */}
                            <div className="flex items-center gap-4 flex-wrap text-xs text-white/40">
                              {item.description && (
                                <span className="text-white/50">{item.description}</span>
                              )}
                              {item.supplier && (
                                <span>Supplier: <span className="text-white/60">{item.supplier}</span></span>
                              )}
                              {item.cost > 0 && (
                                <span>Cost: <span className="text-white font-mono">{formatCurrency(item.cost)}</span></span>
                              )}
                              {item.due_date && (
                                <span className={overdue ? 'text-danger' : ''}>
                                  <CalendarDays className="h-3 w-3 inline mr-0.5 -mt-px" />
                                  Due: <span className={overdue ? 'text-danger font-medium' : 'text-white/60'}>{formatDate(item.due_date)}</span>
                                </span>
                              )}
                            </div>

                            {/* Notes */}
                            {item.notes && (
                              <p className="text-xs text-white/30 mt-1 italic">{item.notes}</p>
                            )}

                            {/* Quick status buttons */}
                            {nextStatuses.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                {nextStatuses.map((status) => {
                                  const cfg = SELECTION_STATUSES[status]
                                  const Icon = status === 'selected' ? CheckSquare : status === 'ordered' ? Package : Truck
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => handleQuickStatus(item.id, status)}
                                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-border text-white/40 hover:text-white hover:border-border-light transition-colors cursor-pointer"
                                    >
                                      <Icon className="h-3 w-3" />
                                      Mark {cfg.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Item to Category */}
                    <div className="px-4 py-2.5 border-t border-border/50">
                      <button
                        onClick={() => openAddSelection(category)}
                        className="flex items-center gap-1.5 text-xs text-amber hover:text-amber-light transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Selection Form Modal */}
      <SelectionForm
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, selection: null, defaultCategory: null })}
        onSubmit={handleFormSubmit}
        selection={formModal.selection}
        defaultCategory={formModal.defaultCategory}
      />

      {/* Delete Confirmation */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
          />
          <div className="relative w-full max-w-sm bg-void-light border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Delete selection?</h3>
            <p className="text-sm text-white/50 mb-4">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.name}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
