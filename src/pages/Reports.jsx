import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart3, FileText, DollarSign, ClipboardList, Users, ChevronDown, ChevronUp,
  ArrowUpDown, TrendingUp, TrendingDown, AlertTriangle, Filter,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { PROJECT_STATUSES, TASK_STATUSES } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import StatCard from '../components/ui/StatCard'

const REPORT_TABS = [
  { id: 'project-summary', label: 'Project Summary', icon: FileText },
  { id: 'budget-vs-actual', label: 'Budget vs Actual', icon: DollarSign },
  { id: 'cash-flow', label: 'Cash Flow', icon: TrendingUp },
  { id: 'task-completion', label: 'Task Completion', icon: ClipboardList },
  { id: 'workforce', label: 'Workforce', icon: Users },
]

export default function Reports() {
  const [activeReport, setActiveReport] = useState('project-summary')
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [budgetCategories, setBudgetCategories] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [dailyLogs, setDailyLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, tRes, bcRes, biRes, iRes, dlRes] = await Promise.allSettled([
        supabase.from('pm_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('pm_tasks').select('*, phase:pm_phases(id, name)'),
        supabase.from('pm_budget_categories').select('*'),
        supabase.from('pm_budget_items').select('*'),
        supabase.from('pm_invoices').select('*'),
        supabase.from('pm_daily_logs').select('*'),
      ])

      setProjects(pRes.status === 'fulfilled' && !pRes.value.error ? pRes.value.data || [] : [])
      setTasks(tRes.status === 'fulfilled' && !tRes.value.error ? tRes.value.data || [] : [])
      setBudgetCategories(bcRes.status === 'fulfilled' && !bcRes.value.error ? bcRes.value.data || [] : [])
      setBudgetItems(biRes.status === 'fulfilled' && !biRes.value.error ? biRes.value.data || [] : [])
      setInvoices(iRes.status === 'fulfilled' && !iRes.value.error ? iRes.value.data || [] : [])
      setDailyLogs(dlRes.status === 'fulfilled' && !dlRes.value.error ? dlRes.value.data || [] : [])
    } catch (err) {
      console.error('Reports loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="hero-banner rounded-xl"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=400&fit=crop)',
          minHeight: '100px',
        }}
      >
        <div className="flex flex-col justify-center px-6 py-6">
          <p className="text-amber text-xs font-semibold uppercase tracking-[0.15em] mb-1.5">
            — Analytics
          </p>
          <h1 className="text-lg font-display text-white">Reports</h1>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {REPORT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 -mb-px',
              activeReport === tab.id
                ? 'border-amber text-amber font-semibold'
                : 'border-transparent text-white/35 hover:text-white/55 hover:bg-white/[0.02]'
            )}
          >
            <tab.icon className="h-4.5 w-4.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'project-summary' && (
        <ProjectSummaryReport projects={projects} tasks={tasks} budgetItems={budgetItems} />
      )}
      {activeReport === 'budget-vs-actual' && (
        <BudgetVsActualReport projects={projects} budgetCategories={budgetCategories} budgetItems={budgetItems} />
      )}
      {activeReport === 'cash-flow' && (
        <CashFlowReport projects={projects} invoices={invoices} />
      )}
      {activeReport === 'task-completion' && (
        <TaskCompletionReport projects={projects} tasks={tasks} />
      )}
      {activeReport === 'workforce' && (
        <WorkforceReport projects={projects} dailyLogs={dailyLogs} />
      )}
    </div>
  )
}

// ============================================================
// 1. PROJECT SUMMARY REPORT
// ============================================================
function ProjectSummaryReport({ projects, tasks, budgetItems }) {
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const reportData = useMemo(() => {
    return projects.map(p => {
      const projectTasks = tasks.filter(t => t.project_id === p.id)
      const completedTasks = projectTasks.filter(t => t.status === 'completed')
      const taskPct = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0

      const projectItems = budgetItems.filter(i => i.project_id === p.id)
      const budgetSpent = projectItems.reduce((sum, i) => sum + (i.amount || 0), 0)
      const contractValue = p.contract_value || 0
      const variance = contractValue > 0 ? ((budgetSpent - contractValue) / contractValue) * 100 : 0

      const daysRemaining = p.target_end_date
        ? Math.max(0, Math.ceil((new Date(p.target_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : null

      return {
        ...p,
        taskPct,
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        budgetSpent,
        variance,
        daysRemaining,
      }
    })
  }, [projects, tasks, budgetItems])

  const filteredData = useMemo(() => {
    let data = reportData
    if (statusFilter !== 'all') {
      data = data.filter(p => p.status === statusFilter)
    }
    data.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return data
  }, [reportData, statusFilter, sortField, sortDir])

  function SortHeader({ field, children }) {
    const active = sortField === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-[11px] font-semibold text-white/35 uppercase tracking-wider hover:text-white/55 transition-colors cursor-pointer"
      >
        {children}
        {active ? (
          sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-0.5 rounded-full bg-amber" />
          <h2 className="text-sm font-semibold text-white">Project Summary</h2>
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-8 pr-8"
          >
            <option value="all">All Statuses</option>
            {Object.entries(PROJECT_STATUSES).map(([key, cfg]) => (
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
                <th className="text-left px-4 py-3"><SortHeader field="name">Project</SortHeader></th>
                <th className="text-left px-4 py-3"><SortHeader field="status">Status</SortHeader></th>
                <th className="text-right px-4 py-3"><SortHeader field="contract_value">Contract Value</SortHeader></th>
                <th className="text-right px-4 py-3"><SortHeader field="budgetSpent">Budget Spent</SortHeader></th>
                <th className="text-right px-4 py-3"><SortHeader field="variance">Variance %</SortHeader></th>
                <th className="text-right px-4 py-3"><SortHeader field="taskPct">Tasks %</SortHeader></th>
                <th className="text-right px-4 py-3"><SortHeader field="daysRemaining">Days Left</SortHeader></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/25">
                    No projects found
                  </td>
                </tr>
              ) : (
                filteredData.map((p, idx) => {
                  const statusCfg = PROJECT_STATUSES[p.status] || PROJECT_STATUSES.planning
                  return (
                    <tr key={p.id} className={cn(
                      'hover:bg-white/[0.02] transition-colors',
                      idx % 2 === 1 && 'bg-white/[0.01]'
                    )}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{p.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusCfg.color}>{statusCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">
                        {formatCurrency(p.contract_value)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">
                        {formatCurrency(p.budgetSpent)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-mono font-medium tabular-nums ${
                          p.variance > 0 ? 'text-danger' : p.variance < 0 ? 'text-success' : 'text-white/40'
                        }`}>
                          {p.variance > 0 ? '+' : ''}{p.variance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full transition-all"
                              style={{ width: `${p.taskPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-white/50 tabular-nums">{p.taskPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-white/50 tabular-nums">
                        {p.daysRemaining != null ? p.daysRemaining : '-'}
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
  )
}

// ============================================================
// 2. BUDGET VS ACTUAL REPORT
// ============================================================
function BudgetVsActualReport({ projects, budgetCategories, budgetItems }) {
  const reportData = useMemo(() => {
    return projects.map(p => {
      const cats = budgetCategories.filter(c => c.project_id === p.id)
      const items = budgetItems.filter(i => i.project_id === p.id)

      const budgeted = cats.reduce((sum, c) => sum + (c.budgeted_amount || 0), 0)
      const actual = items.reduce((sum, i) => sum + (i.amount || 0), 0)
      const projected = actual // could be enhanced with forecasting
      const variance = budgeted - actual

      return {
        id: p.id,
        name: p.name,
        budgeted,
        actual,
        projected,
        variance,
        variancePct: budgeted > 0 ? (variance / budgeted) * 100 : 0,
      }
    }).filter(p => p.budgeted > 0 || p.actual > 0)
  }, [projects, budgetCategories, budgetItems])

  const totals = useMemo(() => {
    return reportData.reduce((acc, p) => ({
      budgeted: acc.budgeted + p.budgeted,
      actual: acc.actual + p.actual,
      projected: acc.projected + p.projected,
      variance: acc.variance + p.variance,
    }), { budgeted: 0, actual: 0, projected: 0, variance: 0 })
  }, [reportData])

  const maxAmount = useMemo(() => {
    return Math.max(...reportData.map(p => Math.max(p.budgeted, p.actual)), 1)
  }, [reportData])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Budgeted" value={formatCurrency(totals.budgeted)} icon={DollarSign} color="info" />
        <StatCard label="Total Actual" value={formatCurrency(totals.actual)} icon={DollarSign} color="amber" />
        <StatCard label="Total Projected" value={formatCurrency(totals.projected)} icon={TrendingUp} color="warning" />
        <StatCard
          label="Total Variance"
          value={formatCurrency(totals.variance)}
          icon={totals.variance >= 0 ? TrendingUp : TrendingDown}
          color={totals.variance >= 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Bar Chart */}
      {reportData.length > 0 && (
        <div className="bg-void-light border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-4 w-0.5 rounded-full bg-amber" />
            <h3 className="text-sm font-semibold text-white">Budget vs Actual by Project</h3>
          </div>
          <div className="space-y-4">
            {reportData.map(p => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-white/60 truncate max-w-[200px]">{p.name}</p>
                  <p className={`text-xs font-mono font-medium tabular-nums ${p.variance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {p.variance >= 0 ? '+' : ''}{formatCurrency(p.variance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25 w-14 shrink-0">Budget</span>
                    <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                      <div
                        className="h-full bg-info/60 rounded transition-all duration-500"
                        style={{ width: `${(p.budgeted / maxAmount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 w-20 text-right shrink-0 tabular-nums">
                      {formatCurrency(p.budgeted)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25 w-14 shrink-0">Actual</span>
                    <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          p.actual > p.budgeted ? 'bg-danger/60' : 'bg-amber/60'
                        }`}
                        style={{ width: `${(p.actual / maxAmount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 w-20 text-right shrink-0 tabular-nums">
                      {formatCurrency(p.actual)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <span className="flex items-center gap-1.5 text-[10px] text-white/25">
              <span className="h-2 w-6 rounded bg-info/60" /> Budgeted
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-white/25">
              <span className="h-2 w-6 rounded bg-amber/60" /> Actual (under)
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-white/25">
              <span className="h-2 w-6 rounded bg-danger/60" /> Actual (over)
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Project</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Budgeted</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Actual</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Projected</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-white/25">
                    No budget data available
                  </td>
                </tr>
              ) : (
                <>
                  {reportData.map((p, idx) => (
                    <tr key={p.id} className={cn(
                      'hover:bg-white/[0.02] transition-colors',
                      idx % 2 === 1 && 'bg-white/[0.01]'
                    )}>
                      <td className="px-4 py-3 text-sm text-white/60">{p.name}</td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">{formatCurrency(p.budgeted)}</td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">{formatCurrency(p.actual)}</td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">{formatCurrency(p.projected)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-mono font-medium tabular-nums ${
                        p.variance >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {p.variance >= 0 ? '+' : ''}{formatCurrency(p.variance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm font-semibold text-white">Totals</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white font-mono tabular-nums">{formatCurrency(totals.budgeted)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white font-mono tabular-nums">{formatCurrency(totals.actual)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white font-mono tabular-nums">{formatCurrency(totals.projected)}</td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums ${
                      totals.variance >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 3. CASH FLOW SUMMARY
// ============================================================
function CashFlowReport({ projects, invoices }) {
  const summary = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0)
    const totalPaid = invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0)
    const outstanding = totalInvoiced - totalPaid
    const today = new Date().toISOString().split('T')[0]
    const overdue = invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.due_date && i.due_date < today)
      .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0)

    return { totalInvoiced, totalPaid, outstanding, overdue }
  }, [invoices])

  const projectBreakdown = useMemo(() => {
    return projects.map(p => {
      const projectInvoices = invoices.filter(i => i.project_id === p.id)
      const invoiced = projectInvoices.reduce((sum, i) => sum + (i.total || 0), 0)
      const paid = projectInvoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0)
      const outstanding = invoiced - paid
      const today = new Date().toISOString().split('T')[0]
      const overdue = projectInvoices
        .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.due_date && i.due_date < today)
        .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0)

      return { id: p.id, name: p.name, invoiced, paid, outstanding, overdue, invoiceCount: projectInvoices.length }
    }).filter(p => p.invoiceCount > 0)
  }, [projects, invoices])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Invoiced" value={formatCurrency(summary.totalInvoiced)} icon={DollarSign} color="info" />
        <StatCard label="Total Paid" value={formatCurrency(summary.totalPaid)} icon={DollarSign} color="success" />
        <StatCard label="Outstanding" value={formatCurrency(summary.outstanding)} icon={DollarSign} color="warning" />
        <StatCard label="Overdue" value={formatCurrency(summary.overdue)} icon={AlertTriangle} color={summary.overdue > 0 ? 'warning' : 'info'} />
      </div>

      {/* Project Breakdown */}
      <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-0.5 rounded-full bg-amber" />
            <h3 className="text-sm font-semibold text-white">Cash Flow by Project</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Project</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Invoiced</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Paid</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Outstanding</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {projectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-white/25">
                    No invoices found
                  </td>
                </tr>
              ) : (
                <>
                  {projectBreakdown.map((p, idx) => (
                    <tr key={p.id} className={cn(
                      'hover:bg-white/[0.02] transition-colors',
                      idx % 2 === 1 && 'bg-white/[0.01]'
                    )}>
                      <td className="px-4 py-3 text-sm text-white/60">{p.name}</td>
                      <td className="px-4 py-3 text-right text-sm text-white/60 font-mono tabular-nums">{formatCurrency(p.invoiced)}</td>
                      <td className="px-4 py-3 text-right text-sm text-success font-mono tabular-nums">{formatCurrency(p.paid)}</td>
                      <td className="px-4 py-3 text-right text-sm text-amber font-mono tabular-nums">{formatCurrency(p.outstanding)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-mono tabular-nums ${p.overdue > 0 ? 'text-danger font-medium' : 'text-white/30'}`}>
                        {formatCurrency(p.overdue)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm font-semibold text-white">Totals</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white font-mono tabular-nums">{formatCurrency(summary.totalInvoiced)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-success font-mono tabular-nums">{formatCurrency(summary.totalPaid)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-amber font-mono tabular-nums">{formatCurrency(summary.outstanding)}</td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold font-mono tabular-nums ${summary.overdue > 0 ? 'text-danger' : 'text-white/30'}`}>
                      {formatCurrency(summary.overdue)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 4. TASK COMPLETION REPORT
// ============================================================
function TaskCompletionReport({ projects, tasks }) {
  const reportData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return projects.map(p => {
      const projectTasks = tasks.filter(t => t.project_id === p.id)
      const total = projectTasks.length
      const completed = projectTasks.filter(t => t.status === 'completed').length
      const inProgress = projectTasks.filter(t => t.status === 'in_progress').length
      const blocked = projectTasks.filter(t => t.status === 'blocked').length
      const pending = projectTasks.filter(t => t.status === 'pending').length
      const overdue = projectTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'skipped').length
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0

      return { id: p.id, name: p.name, total, completed, inProgress, blocked, pending, overdue, pct }
    }).filter(p => p.total > 0)
  }, [projects, tasks])

  const totals = useMemo(() => {
    return reportData.reduce((acc, p) => ({
      total: acc.total + p.total,
      completed: acc.completed + p.completed,
      inProgress: acc.inProgress + p.inProgress,
      blocked: acc.blocked + p.blocked,
      pending: acc.pending + p.pending,
      overdue: acc.overdue + p.overdue,
    }), { total: 0, completed: 0, inProgress: 0, blocked: 0, pending: 0, overdue: 0 })
  }, [reportData])

  const overallPct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={totals.total} icon={ClipboardList} color="info" />
        <StatCard label="Completed" value={`${totals.completed} (${overallPct}%)`} icon={ClipboardList} color="success" />
        <StatCard label="In Progress" value={totals.inProgress} icon={ClipboardList} color="amber" />
        <StatCard label="Overdue" value={totals.overdue} icon={AlertTriangle} color={totals.overdue > 0 ? 'warning' : 'info'} />
      </div>

      {/* Per-project table */}
      <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Project</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Progress</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Total</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Done</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Blocked</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Pending</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-white/25">
                    No tasks found
                  </td>
                </tr>
              ) : (
                reportData.map((p, idx) => (
                  <tr key={p.id} className={cn(
                    'hover:bg-white/[0.02] transition-colors',
                    idx % 2 === 1 && 'bg-white/[0.01]'
                  )}>
                    <td className="px-4 py-3 text-sm text-white/60 truncate max-w-[180px]">{p.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full transition-all duration-500"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-white/50 w-10 text-right tabular-nums">{p.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white/50 tabular-nums">{p.total}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-success tabular-nums">{p.completed}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-info tabular-nums">{p.inProgress}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-danger tabular-nums">{p.blocked}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-white/35 tabular-nums">{p.pending}</td>
                    <td className={`px-4 py-3 text-right text-sm font-mono tabular-nums ${p.overdue > 0 ? 'text-danger font-medium' : 'text-white/25'}`}>
                      {p.overdue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 5. WORKFORCE REPORT
// ============================================================
function WorkforceReport({ projects, dailyLogs }) {
  const summary = useMemo(() => {
    const totalHours = dailyLogs.reduce((sum, l) => sum + (l.hours_worked || 0), 0)
    const totalWorkers = dailyLogs.reduce((sum, l) => sum + (l.workers_on_site || 0), 0)
    const avgWorkers = dailyLogs.length > 0 ? (totalWorkers / dailyLogs.length).toFixed(1) : 0
    const totalLogs = dailyLogs.length

    return { totalHours, avgWorkers, totalLogs }
  }, [dailyLogs])

  const projectBreakdown = useMemo(() => {
    return projects.map(p => {
      const logs = dailyLogs.filter(l => l.project_id === p.id)
      const hours = logs.reduce((sum, l) => sum + (l.hours_worked || 0), 0)
      const workers = logs.reduce((sum, l) => sum + (l.workers_on_site || 0), 0)
      const avgWorkers = logs.length > 0 ? (workers / logs.length).toFixed(1) : 0

      return { id: p.id, name: p.name, hours, avgWorkers, logCount: logs.length }
    }).filter(p => p.logCount > 0)
  }, [projects, dailyLogs])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Hours Logged" value={summary.totalHours.toFixed(1)} icon={Users} color="amber" />
        <StatCard label="Avg Workers/Day" value={summary.avgWorkers} icon={Users} color="info" />
        <StatCard label="Daily Log Entries" value={summary.totalLogs} icon={ClipboardList} color="success" />
      </div>

      {/* Project Breakdown */}
      <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-0.5 rounded-full bg-amber" />
            <h3 className="text-sm font-semibold text-white">Hours by Project</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Project</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Total Hours</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Avg Workers/Day</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/35 uppercase tracking-wider">Log Entries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {projectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-white/25">
                    No daily logs found
                  </td>
                </tr>
              ) : (
                projectBreakdown.map((p, idx) => (
                  <tr key={p.id} className={cn(
                    'hover:bg-white/[0.02] transition-colors',
                    idx % 2 === 1 && 'bg-white/[0.01]'
                  )}>
                    <td className="px-4 py-3 text-sm text-white/60">{p.name}</td>
                    <td className="px-4 py-3 text-right text-sm text-amber font-mono tabular-nums">{p.hours.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-sm text-white/50 font-mono tabular-nums">{p.avgWorkers}</td>
                    <td className="px-4 py-3 text-right text-sm text-white/50 font-mono tabular-nums">{p.logCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
