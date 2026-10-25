import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Clock, AlertCircle, Search, ExternalLink, Receipt, Download, X, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'

/* ─── Month helpers ─── */
function getMonthKey(date) {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
    })
  }
  return months
}

function getMonthLabel(monthKey) {
  if (!monthKey) return 'All Time'
  const [y, m] = monthKey.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

/* ─── Status badge mapping ─── */
const expenseStatusVariant = {
  paid: 'success',
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  overdue: 'danger',
}

const invoiceStatusVariant = {
  paid: 'success',
  unpaid: 'warning',
  overdue: 'danger',
  partial: 'info',
  cancelled: 'neutral',
}

function formatAUD(amount) {
  if (amount == null) return '$0.00'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/* ─── Image Preview Modal ─── */
function ImagePreviewModal({ src, onClose }) {
  if (!src) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-3xl max-h-[85vh] mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-colors z-10 cursor-pointer"
        >
          <X size={16} />
        </button>
        <img
          src={src}
          alt="Receipt preview"
          className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
        />
      </div>
    </div>
  )
}

export default function ExpenseHub() {
  const [expenses, setExpenses] = useState([])
  const [invoices, setInvoices] = useState([])
  const [tab, setTab] = useState('expenses')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [previewImage, setPreviewImage] = useState(null)

  const months = getLast6Months()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [expRes, invRes] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_invoices').select('*').order('created_at', { ascending: false }),
      ])
      setExpenses(expRes.data || [])
      setInvoices(invRes.data || [])
    } catch (err) {
      console.error('ExpenseHub fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ─── Month-filtered data for stats ─── */
  const monthFilteredExpenses = selectedMonth
    ? expenses.filter(e => getMonthKey(e.date || e.created_at) === selectedMonth)
    : expenses
  const monthFilteredInvoices = selectedMonth
    ? invoices.filter(i => getMonthKey(i.issue_date || i.created_at) === selectedMonth)
    : invoices

  const totalExpenses = monthFilteredExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalInvoices = monthFilteredInvoices.reduce((s, i) => s + (i.amount || 0), 0)
  const pendingExpenses = monthFilteredExpenses.filter(e => e.status === 'pending')
  const unpaidInvoices = monthFilteredInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue')

  const monthLabel = getMonthLabel(selectedMonth)

  /* ─── Text search + month filter ─── */
  const activeList = tab === 'expenses' ? expenses : invoices
  const filtered = activeList.filter(item => {
    // Month filter
    if (selectedMonth) {
      const dateField = tab === 'expenses'
        ? (item.date || item.created_at)
        : (item.issue_date || item.created_at)
      if (getMonthKey(dateField) !== selectedMonth) return false
    }
    // Text search
    if (!search) return true
    const q = search.toLowerCase()
    return [
      item.title || item.invoice_number || '',
      item.supplier || '',
      item.category || '',
    ].some(f => f.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-5">
      {/* Image Preview Modal */}
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />

      {/* Title */}
      <div className="mb-1">
        <p className="text-amber text-xs font-semibold uppercase tracking-[0.15em] mb-1.5">
          — Expense Hub
        </p>
        <h1 className="text-lg font-display text-white">Expenses & Invoices</h1>
      </div>

      {/* ─── Month Selector ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-white/30 mr-1 uppercase tracking-wider">Period:</span>
        {months.map(m => (
          <button
            key={m.key}
            onClick={() => setSelectedMonth(m.key === selectedMonth ? null : m.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              selectedMonth === m.key
                ? 'bg-gradient-to-r from-amber/15 to-amber/5 text-amber border border-amber/20 shadow-sm shadow-amber/5'
                : 'bg-void-light border border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60'
            )}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setSelectedMonth(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
            !selectedMonth
              ? 'bg-gradient-to-r from-amber/15 to-amber/5 text-amber border border-amber/20 shadow-sm shadow-amber/5'
              : 'bg-void-light border border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60'
          )}
        >
          All Time
        </button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: formatAUD(totalExpenses), icon: DollarSign, color: 'text-white/60', iconBg: 'bg-white/[0.06]' },
          { label: 'Total Invoices', value: formatAUD(totalInvoices), icon: FileText, color: 'text-info', iconBg: 'bg-info/10' },
          { label: 'Pending Expenses', value: pendingExpenses.length, icon: Clock, color: 'text-warning', iconBg: 'bg-warning/10' },
          { label: 'Unpaid Invoices', value: unpaidInvoices.length, icon: AlertCircle, color: 'text-danger', iconBg: 'bg-danger/10' },
        ].map(s => (
          <div key={s.label} className="bg-void-light border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.iconBg)}>
                <s.icon className={cn('h-[18px] w-[18px]', s.color)} />
              </div>
              <span className={cn('text-2xl font-bold tracking-tight tabular-nums', s.color)}>
                {s.value}
              </span>
            </div>
            <p className="text-white/30 text-xs font-medium">{s.label}</p>
            <p className="text-white/20 text-[10px] mt-0.5">{monthLabel}</p>
          </div>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, supplier..."
            className="w-full pl-9"
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-void-light border border-white/[0.06] rounded-lg p-1 w-fit">
        {[
          { key: 'expenses', label: 'Expenses', count: tab === 'expenses' ? filtered.length : monthFilteredExpenses.length },
          { key: 'invoices', label: 'Supplier Invoices', count: tab === 'invoices' ? filtered.length : monthFilteredInvoices.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer',
              tab === t.key
                ? 'bg-gradient-to-r from-amber/10 to-amber/[0.03] text-amber shadow-sm shadow-amber/5'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {t.label}
            <span className={cn(
              'text-[11px] px-1.5 py-0.5 rounded-md font-semibold',
              tab === t.key ? 'bg-amber/15 text-amber' : 'bg-white/[0.06] text-white/30'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Table Content ─── */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={search ? 'No results match your search' : `No ${tab === 'expenses' ? 'expenses' : 'invoices'} for ${monthLabel}`}
          description={search ? 'Try a different search term.' : 'Records will appear here once they are added.'}
        />
      ) : tab === 'expenses' ? (
        /* ── Expenses Table ── */
        <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-white/35 uppercase tracking-wider">
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Receipt</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((exp, idx) => (
              <div
                key={exp.id}
                className={cn(
                  'grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                  idx % 2 === 1 && 'bg-white/[0.01]'
                )}
              >
                <div className="lg:col-span-3">
                  <p className="text-sm font-medium text-white">{exp.title || '—'}</p>
                  <p className="text-xs text-white/25 lg:hidden">{exp.supplier || ''}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm text-white/45 truncate">{exp.supplier || '—'}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  <p className="text-sm font-semibold text-white tabular-nums">{formatAUD(exp.amount)}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/50 capitalize border border-white/10">
                    {exp.category || '—'}
                  </span>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  <p className="text-sm text-white/35">{formatDate(exp.date || exp.created_at)}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <Badge variant={expenseStatusVariant[exp.status] || 'neutral'}>
                    {exp.status ? exp.status.charAt(0).toUpperCase() + exp.status.slice(1) : '—'}
                  </Badge>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  {exp.image_url ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewImage(exp.image_url)}
                        className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-amber/40 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <img src={exp.image_url} alt="Receipt" className="w-full h-full object-cover" />
                      </button>
                      <a
                        href={exp.image_url}
                        download
                        className="text-white/30 hover:text-white/60 transition-colors"
                        title="Download receipt"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </div>
                <div className="flex gap-3 lg:hidden mt-1">
                  <span className="text-xs text-amber tabular-nums">{formatAUD(exp.amount)}</span>
                  <Badge variant={expenseStatusVariant[exp.status] || 'neutral'}>
                    {exp.status ? exp.status.charAt(0).toUpperCase() + exp.status.slice(1) : '—'}
                  </Badge>
                  {exp.image_url && (
                    <button onClick={() => setPreviewImage(exp.image_url)} className="text-xs text-amber hover:text-amber/80 cursor-pointer">
                      View receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Invoices Table ── */
        <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-white/35 uppercase tracking-wider">
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">GST</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">File</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((inv, idx) => (
              <div
                key={inv.id}
                className={cn(
                  'grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                  idx % 2 === 1 && 'bg-white/[0.01]'
                )}
              >
                <div className="lg:col-span-2">
                  <p className="text-sm font-mono font-medium text-white">{inv.invoice_number || '—'}</p>
                  <p className="text-xs text-white/25 lg:hidden">{inv.supplier || ''}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm text-white/45 truncate">{inv.supplier || '—'}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm font-semibold text-white tabular-nums">{formatAUD(inv.amount)}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  <p className="text-sm text-white/35 tabular-nums">{formatAUD(inv.gst)}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm text-white/35">{formatDate(inv.due_date)}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  <Badge variant={invoiceStatusVariant[inv.status] || 'neutral'}>
                    {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : '—'}
                  </Badge>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  {inv.file_url ? (
                    <div className="flex items-center gap-2.5">
                      <a href={inv.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber text-xs font-medium hover:text-amber/80 transition-colors"
                        title="View in new tab">
                        <FileText className="h-3 w-3" /> View
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <a href={inv.file_url} download
                        className="text-white/30 hover:text-white/60 transition-colors"
                        title="Download file">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </div>
                <div className="flex gap-3 lg:hidden mt-1">
                  <span className="text-xs text-amber tabular-nums">{formatAUD(inv.amount)}</span>
                  <Badge variant={invoiceStatusVariant[inv.status] || 'neutral'}>
                    {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : '—'}
                  </Badge>
                  {inv.file_url && (
                    <div className="flex items-center gap-2">
                      <a href={inv.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-amber hover:text-amber/80">View</a>
                      <a href={inv.file_url} download
                        className="text-xs text-white/40 hover:text-white/60">Download</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
