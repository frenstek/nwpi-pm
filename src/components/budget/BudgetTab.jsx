import { useState, useEffect, useCallback } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Pencil, Trash2,
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
} from 'lucide-react'
import { useBudget } from '../../hooks/useBudget'
import { BUDGET_STATUSES } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import BudgetCategoryForm from './BudgetCategoryForm'
import BudgetItemForm from './BudgetItemForm'

const COUNTED_STATUSES = ['approved', 'invoiced', 'paid']

export default function BudgetTab({ projectId }) {
  const {
    categories,
    items,
    loading,
    fetchBudgetCategories,
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    fetchBudgetItems,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
  } = useBudget()

  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null })
  const [itemModal, setItemModal] = useState({ open: false, item: null, defaultCategoryId: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '' })

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchBudgetCategories(projectId),
      fetchBudgetItems(projectId),
    ])
  }, [projectId, fetchBudgetCategories, fetchBudgetItems])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute totals
  const totalBudget = categories.reduce((sum, cat) => sum + (cat.budgeted_amount || 0), 0)
  const totalSpent = items
    .filter((item) => COUNTED_STATUSES.includes(item.status))
    .reduce((sum, item) => sum + (item.amount || 0), 0)
  const remaining = totalBudget - totalSpent
  const variancePercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100) : 0

  function getVarianceColor(percent) {
    if (percent > 100) return 'text-danger'
    if (percent > 90) return 'text-amber'
    return 'text-success'
  }

  function getProgressColor(percent) {
    if (percent > 100) return 'bg-danger'
    if (percent > 90) return 'bg-amber'
    return 'bg-success'
  }

  function toggleCategory(catId) {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  // Category actions
  function openAddCategory() {
    setCategoryModal({ open: true, category: null })
  }

  function openEditCategory(cat) {
    setCategoryModal({ open: true, category: cat })
  }

  async function handleCategorySubmit(data) {
    if (categoryModal.category) {
      await updateBudgetCategory(categoryModal.category.id, data)
    } else {
      const maxSort = categories.length > 0
        ? Math.max(...categories.map((c) => c.sort_order || 0))
        : -1
      await createBudgetCategory({
        ...data,
        project_id: projectId,
        sort_order: maxSort + 1,
      })
    }
    await loadData()
  }

  // Item actions
  function openAddItem(categoryId) {
    setItemModal({ open: true, item: null, defaultCategoryId: categoryId })
  }

  function openEditItem(item) {
    setItemModal({ open: true, item, defaultCategoryId: null })
  }

  async function handleItemSubmit(data) {
    if (itemModal.item) {
      await updateBudgetItem(itemModal.item.id, data)
    } else {
      await createBudgetItem({
        ...data,
        project_id: projectId,
      })
    }
    await loadData()
  }

  // Delete
  function confirmDelete(type, id, name) {
    setDeleteConfirm({ open: true, type, id, name })
  }

  async function handleDelete() {
    if (deleteConfirm.type === 'category') {
      await deleteBudgetCategory(deleteConfirm.id)
    } else {
      await deleteBudgetItem(deleteConfirm.id)
    }
    setDeleteConfirm({ open: false, type: null, id: null, name: '' })
    await loadData()
  }

  // Group items by category
  function getItemsForCategory(catId) {
    return items.filter((item) => item.category_id === catId)
  }

  function getCategorySpent(catId) {
    return getItemsForCategory(catId)
      .filter((item) => COUNTED_STATUSES.includes(item.status))
      .reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  if (loading && categories.length === 0) {
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Budget</p>
            <p className="text-lg font-semibold text-white font-mono">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Total Spent</p>
            <p className="text-lg font-semibold text-white font-mono">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Remaining</p>
            <p className={`text-lg font-semibold font-mono ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && <span className="text-xs ml-1">over</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Variance</p>
            <div className="flex items-center gap-1.5">
              <p className={`text-lg font-semibold font-mono ${getVarianceColor(variancePercent)}`}>
                {variancePercent.toFixed(1)}%
              </p>
              {variancePercent > 100 ? (
                <TrendingUp className="h-4 w-4 text-danger" />
              ) : variancePercent > 90 ? (
                <AlertTriangle className="h-4 w-4 text-amber" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(variancePercent)}`}
            style={{ width: `${Math.min(variancePercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-white/30">0%</span>
          <span className="text-[10px] text-white/30">100%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Budget Breakdown</h3>
        <Button size="sm" onClick={openAddCategory}>
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </Button>
      </div>

      {/* Budget Table */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-surface mb-3">
            <DollarSign className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-sm text-white/40 mb-1">No budget categories yet</p>
          <p className="text-xs text-white/25 mb-4">Add categories to start tracking your project budget</p>
          <Button size="sm" onClick={openAddCategory}>
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catItems = getItemsForCategory(cat.id)
            const catSpent = getCategorySpent(cat.id)
            const catBudget = cat.budgeted_amount || 0
            const catVariance = catBudget > 0 ? ((catSpent / catBudget) * 100) : 0
            const isCollapsed = collapsedCategories[cat.id]

            return (
              <div
                key={cat.id}
                className="bg-void-light border border-border rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                  onClick={() => toggleCategory(cat.id)}
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
                      <span className="text-sm font-medium text-white truncate">{cat.name}</span>
                      <span className="text-xs text-white/30">
                        {catItems.length} item{catItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-xs font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-white/40 mr-1.5">Budget:</span>
                      <span className="text-white">{formatCurrency(catBudget)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white/40 mr-1.5">Spent:</span>
                      <span className="text-white">{formatCurrency(catSpent)}</span>
                    </div>
                    <div className="text-right">
                      <span className={`${getVarianceColor(catVariance)}`}>
                        {catVariance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
                      title="Edit category"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => confirmDelete('category', cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile category stats */}
                {!isCollapsed && (
                  <div className="flex sm:hidden items-center gap-4 px-4 pb-2 text-xs font-mono">
                    <span className="text-white/40">Budget: <span className="text-white">{formatCurrency(catBudget)}</span></span>
                    <span className="text-white/40">Spent: <span className="text-white">{formatCurrency(catSpent)}</span></span>
                    <span className={getVarianceColor(catVariance)}>{catVariance.toFixed(1)}%</span>
                  </div>
                )}

                {/* Items Table */}
                {!isCollapsed && (
                  <div className="border-t border-border">
                    {catItems.length > 0 ? (
                      <div className="divide-y divide-border/50">
                        {/* Table header */}
                        <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white/30 bg-surface/30">
                          <div className="col-span-3">Description</div>
                          <div className="col-span-2">Supplier</div>
                          <div className="col-span-2 text-right">Amount</div>
                          <div className="col-span-2 text-center">Status</div>
                          <div className="col-span-2">Invoice #</div>
                          <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {catItems.map((item) => {
                          const statusConfig = BUDGET_STATUSES[item.status] || BUDGET_STATUSES.pending
                          return (
                            <div
                              key={item.id}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5 hover:bg-surface/30 transition-colors group"
                            >
                              {/* Mobile layout */}
                              <div className="sm:hidden space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">{item.description}</span>
                                  <span className="text-sm font-mono text-white">{formatCurrency(item.amount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {item.supplier && <span className="text-xs text-white/40">{item.supplier}</span>}
                                    <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openEditItem(item)}
                                      className="p-1 rounded text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => confirmDelete('item', item.id, item.description)}
                                      className="p-1 rounded text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Desktop layout */}
                              <div className="hidden sm:flex col-span-3 items-center">
                                <span className="text-sm text-white truncate">{item.description}</span>
                              </div>
                              <div className="hidden sm:flex col-span-2 items-center">
                                <span className="text-xs text-white/40 truncate">{item.supplier || '-'}</span>
                              </div>
                              <div className="hidden sm:flex col-span-2 items-center justify-end">
                                <span className="text-sm font-mono text-white">{formatCurrency(item.amount)}</span>
                              </div>
                              <div className="hidden sm:flex col-span-2 items-center justify-center">
                                <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                              </div>
                              <div className="hidden sm:flex col-span-2 items-center">
                                <span className="text-xs text-white/40 truncate">
                                  {item.invoice_number || '-'}
                                </span>
                              </div>
                              <div className="hidden sm:flex col-span-1 items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditItem(item)}
                                  className="p-1 rounded text-white/30 hover:text-white hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => confirmDelete('item', item.id, item.description)}
                                  className="p-1 rounded text-white/30 hover:text-danger hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-white/25">No items in this category</p>
                      </div>
                    )}

                    {/* Add Item Button */}
                    <div className="px-4 py-2.5 border-t border-border/50">
                      <button
                        onClick={() => openAddItem(cat.id)}
                        className="flex items-center gap-1.5 text-xs text-amber hover:text-amber-light transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Category Modal */}
      <BudgetCategoryForm
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSubmit={handleCategorySubmit}
        category={categoryModal.category}
      />

      {/* Item Modal */}
      <BudgetItemForm
        isOpen={itemModal.open}
        onClose={() => setItemModal({ open: false, item: null, defaultCategoryId: null })}
        onSubmit={handleItemSubmit}
        item={itemModal.item}
        categories={categories}
        defaultCategoryId={itemModal.defaultCategoryId}
      />

      {/* Delete Confirmation */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}
          />
          <div className="relative w-full max-w-sm bg-void-light border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Delete {deleteConfirm.type}?</h3>
            <p className="text-sm text-white/50 mb-1">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.name}"</span>?
            </p>
            {deleteConfirm.type === 'category' && (
              <p className="text-xs text-danger/80 mb-4">
                This will also delete all items in this category.
              </p>
            )}
            {deleteConfirm.type !== 'category' && <div className="mb-4" />}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}
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
