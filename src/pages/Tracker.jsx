import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Clock, AlertTriangle, XCircle, ExternalLink,
  ArrowUpDown, Filter,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'

const STATUS_CONFIG = {
  not_started: { label: '-', bg: 'bg-white/[0.03]', text: 'text-white/20', dot: 'bg-white/20' },
  in_progress: { label: 'In Progress', bg: 'bg-amber/[0.06]', text: 'text-amber', dot: 'bg-amber' },
  applied: { label: 'Applied', bg: 'bg-blue-500/[0.06]', text: 'text-blue-400', dot: 'bg-blue-400' },
  quote_received: { label: 'Quote Received', bg: 'bg-cyan-500/[0.06]', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  not_required: { label: 'N/A', bg: 'bg-white/[0.02]', text: 'text-white/15', dot: 'bg-white/15' },
  demolished: { label: 'Demolished', bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  waiting_for_drawings: { label: 'Waiting Drawings', bg: 'bg-amber/[0.06]', text: 'text-amber', dot: 'bg-amber' },
  waiting_for_pic: { label: 'Waiting PIC', bg: 'bg-amber/[0.06]', text: 'text-amber', dot: 'bg-amber' },
  approved: { label: 'BP', bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  not_settled: { label: 'Not Settled', bg: 'bg-red-500/[0.06]', text: 'text-red-400', dot: 'bg-red-400' },
}

function getConfig(value) {
  return STATUS_CONFIG[value] || STATUS_CONFIG.not_started
}

function isDone(value) {
  return value === 'completed' || value === 'demolished' || value === 'approved' || value === 'not_required'
}

const COLUMNS = [
  { key: 'demolition_status', label: 'Demolition' },
  { key: 'elec_abolishment', label: 'Elec' },
  { key: 'gas_abolishment', label: 'Gas' },
  { key: 'engineering_status', label: 'Eng' },
  { key: 'working_drawings', label: 'WD' },
  { key: 'fire_status', label: 'Fire' },
  { key: 'soil_test', label: 'Soil' },
  { key: 'building_permit', label: 'Building Permit' },
]

function StatusCell({ value }) {
  const cfg = getConfig(value)
  return (
    <td className={`px-3 py-3 text-center whitespace-nowrap ${cfg.bg}`}>
      <div className="flex items-center justify-center gap-1.5">
        <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot} shrink-0`} />
        <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>
    </td>
  )
}

export default function Tracker() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('pm_projects')
        .select('id, name, address, suburb, state, status, settlement_date, permit_required, permit_notes, demolition_status, elec_abolishment, gas_abolishment, engineering_status, working_drawings, fire_status, soil_test, building_permit, mouldus_arriving_date, other_approvals')
        .order('created_at', { ascending: true })

      const { data, error } = await query
      if (!error) setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Filter
  const filtered = projects.filter(p => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return p.status === 'active'
    if (statusFilter === 'planning') return p.status === 'planning'
    if (statusFilter === 'completed') return p.status === 'completed'
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortField] || '').toString().toLowerCase()
    const bv = (b[sortField] || '').toString().toLowerCase()
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  function toggleSort(field) {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  // Stats
  const totalProjects = filtered.length
  const allDoneCount = filtered.filter(p =>
    COLUMNS.every(c => isDone(p[c.key]))
  ).length

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-display text-white">Project Tracker</h1>
          <p className="text-sm text-white/40 mt-0.5">Pre-construction status across all properties</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-white focus:border-amber/50 outline-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Badge variant={allDoneCount === totalProjects && totalProjects > 0 ? 'success' : 'warning'}>
            {allDoneCount}/{totalProjects} Fully Clear
          </Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px]">
        {[
          { dot: 'bg-emerald-400', label: 'Done' },
          { dot: 'bg-cyan-400', label: 'Quote Received' },
          { dot: 'bg-amber', label: 'In Progress / Waiting' },
          { dot: 'bg-blue-400', label: 'Applied' },
          { dot: 'bg-white/20', label: 'Not Started' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${l.dot}`} />
            <span className="text-white/40">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-void-light border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-10 bg-void-light px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 cursor-pointer"
                  >
                    Project Address
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Settle</span>
                </th>
                <th className="px-3 py-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Permit</span>
                </th>
                {COLUMNS.map(col => (
                  <th key={col.key} className="px-3 py-3 text-center">
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 cursor-pointer"
                    >
                      {col.label}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Others</span>
                </th>
                <th className="px-3 py-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Mouldus</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.map((p, i) => {
                const doneCount = COLUMNS.filter(c => isDone(p[c.key])).length
                const progress = Math.round((doneCount / COLUMNS.length) * 100)

                return (
                  <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                    {/* Project Name - sticky */}
                    <td className="sticky left-0 z-10 bg-void-light group-hover:bg-[#0e1726] transition-colors px-4 py-3 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-0">
                          <Link
                            to={`/projects/${p.id}?tab=pre-construction`}
                            className="text-sm font-medium text-white hover:text-amber transition-colors truncate flex items-center gap-1.5"
                          >
                            {p.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
                          </Link>
                          {/* Progress bar */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1 w-16 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-400' : 'bg-amber/60'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/25 tabular-nums">{doneCount}/{COLUMNS.length}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Settlement */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="text-xs text-white/50 font-mono">{p.settlement_date || '-'}</span>
                    </td>

                    {/* Permit */}
                    <td className="px-3 py-3 text-center">
                      {p.permit_required ? (
                        <span className="inline-flex items-center rounded-md bg-amber/10 px-2 py-0.5 text-[11px] font-semibold text-amber">YES</span>
                      ) : (
                        <span className="text-[11px] text-white/20">no</span>
                      )}
                    </td>

                    {/* Tracking columns */}
                    {COLUMNS.map(col => (
                      <StatusCell key={col.key} value={p[col.key] || 'not_started'} />
                    ))}

                    {/* Others */}
                    <td className="px-3 py-3 text-center max-w-[140px]">
                      {p.other_approvals ? (
                        <span className="text-[11px] text-amber/80 truncate block" title={p.other_approvals}>
                          {p.other_approvals}
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/15">-</span>
                      )}
                    </td>

                    {/* Mouldus */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {p.mouldus_arriving_date ? (
                        <span className="text-[11px] text-white/50">{p.mouldus_arriving_date}</span>
                      ) : (
                        <span className="text-[11px] text-white/15">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/30">No projects found</p>
          </div>
        )}
      </div>

      {/* Permit Notes Summary */}
      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Application Notes</h3>
        </div>
        <div className="divide-y divide-border/50">
          {sorted.filter(p => p.permit_notes).map(p => (
            <div key={p.id} className="px-5 py-3 flex gap-4">
              <Link
                to={`/projects/${p.id}?tab=pre-construction`}
                className="text-sm font-medium text-amber hover:text-amber/80 whitespace-nowrap shrink-0 min-w-[200px]"
              >
                {p.name}
              </Link>
              <p className="text-xs text-white/40 leading-relaxed">{p.permit_notes}</p>
            </div>
          ))}
          {sorted.filter(p => p.permit_notes).length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-white/30">No application notes recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
