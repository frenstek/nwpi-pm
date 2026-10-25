import { useState, useEffect, useRef } from 'react'
import {
  Save, CheckCircle, Clock, AlertTriangle, XCircle,
  Zap, Flame, FlaskConical, FileCheck, HardHat,
  Building, Shovel, FileText, Paperclip, Upload, Trash2, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import Badge from '../ui/Badge'

const TRACKING_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'default', icon: Clock },
  { value: 'in_progress', label: 'In Progress', color: 'warning', icon: AlertTriangle },
  { value: 'applied', label: 'Applied', color: 'info', icon: FileText },
  { value: 'quote_received', label: 'Quote Received', color: 'info', icon: FileCheck },
  { value: 'completed', label: 'Completed', color: 'success', icon: CheckCircle },
  { value: 'not_required', label: 'Not Required', color: 'default', icon: XCircle },
]

const DEMOLITION_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'quote_received', label: 'Quote Received' },
  { value: 'demolished', label: 'Demolished' },
  { value: 'not_required', label: 'Not Required' },
]

const BUILDING_PERMIT_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'waiting_for_drawings', label: 'Waiting for Drawings' },
  { value: 'waiting_for_pic', label: 'Waiting for PIC' },
  { value: 'applied', label: 'Applied' },
  { value: 'approved', label: 'Approved' },
  { value: 'not_required', label: 'Not Required' },
]

const TRACKING_ITEMS = [
  { key: 'demolition_status', label: 'Demolition', icon: Shovel, statuses: DEMOLITION_STATUSES },
  { key: 'elec_abolishment', label: 'Electrical Abolishment', icon: Zap, statuses: TRACKING_STATUSES },
  { key: 'gas_abolishment', label: 'Gas Abolishment', icon: Flame, statuses: TRACKING_STATUSES },
  { key: 'engineering_status', label: 'Engineering', icon: HardHat, statuses: TRACKING_STATUSES },
  { key: 'working_drawings', label: 'Working Drawings', icon: FileText, statuses: TRACKING_STATUSES },
  { key: 'fire_status', label: 'Fire', icon: AlertTriangle, statuses: TRACKING_STATUSES },
  { key: 'soil_test', label: 'Soil Test', icon: FlaskConical, statuses: TRACKING_STATUSES },
  { key: 'building_permit', label: 'Building Permit', icon: Building, statuses: BUILDING_PERMIT_STATUSES },
]

function getColorForStatus(value) {
  if (!value || value === 'not_started') return 'default'
  if (value === 'completed' || value === 'demolished' || value === 'approved') return 'success'
  if (value === 'in_progress' || value === 'applied' || value === 'waiting_for_drawings' || value === 'waiting_for_pic') return 'warning'
  if (value === 'quote_received') return 'info'
  return 'default'
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function TrackingCard({ item, value, files, onStatusChange, onUpload, onDeleteFile, uploading }) {
  const fileRef = useRef(null)
  const Icon = item.icon
  const badgeColor = getColorForStatus(value)
  const statusLabel = item.statuses.find(s => s.value === value)?.label || value
  const fileCount = files.length

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(item.key, file)
    e.target.value = ''
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${
            badgeColor === 'success' ? 'bg-emerald-500/10 text-emerald-400'
              : badgeColor === 'warning' ? 'bg-amber/10 text-amber'
              : badgeColor === 'info' ? 'bg-blue-500/10 text-blue-400'
              : 'bg-white/5 text-white/30'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-white">{item.label}</span>
        </div>
        {/* File indicator */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
            fileCount > 0
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/[0.04] text-white/25 hover:bg-white/[0.08] hover:text-white/40'
          }`}
          title={fileCount > 0 ? `${fileCount} file(s) attached` : 'Upload file'}
        >
          <Paperclip className="h-3 w-3" />
          {fileCount > 0 ? fileCount : <Upload className="h-3 w-3" />}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Status dropdown */}
      <select
        value={value}
        onChange={e => onStatusChange(item.key, e.target.value)}
        className="w-full rounded-lg border border-border bg-void px-3 py-2 text-sm text-white focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors cursor-pointer appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23ffffff60' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
      >
        {item.statuses.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <Badge variant={badgeColor}>{statusLabel}</Badge>

      {/* File list */}
      {fileCount > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 group">
              <Paperclip className="h-3 w-3 text-white/20 shrink-0" />
              <a
                href={f.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/50 hover:text-amber truncate flex-1 flex items-center gap-1"
                title={f.file_name}
              >
                {f.file_name}
                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100" />
              </a>
              {f.file_size > 0 && (
                <span className="text-[10px] text-white/20 shrink-0">{formatBytes(f.file_size)}</span>
              )}
              <button
                onClick={() => onDeleteFile(f)}
                className="p-0.5 rounded text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                title="Remove file"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PreConstructionTab({ projectId, project }) {
  const [form, setForm] = useState({
    settlement_date: '',
    permit_required: false,
    permit_notes: '',
    demolition_status: 'not_started',
    elec_abolishment: 'not_started',
    gas_abolishment: 'not_started',
    engineering_status: 'not_started',
    working_drawings: 'not_started',
    fire_status: 'not_started',
    soil_test: 'not_started',
    other_approvals: '',
    building_permit: 'not_started',
    mouldus_arriving_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        settlement_date: project.settlement_date || '',
        permit_required: project.permit_required || false,
        permit_notes: project.permit_notes || '',
        demolition_status: project.demolition_status || 'not_started',
        elec_abolishment: project.elec_abolishment || 'not_started',
        gas_abolishment: project.gas_abolishment || 'not_started',
        engineering_status: project.engineering_status || 'not_started',
        working_drawings: project.working_drawings || 'not_started',
        fire_status: project.fire_status || 'not_started',
        soil_test: project.soil_test || 'not_started',
        other_approvals: project.other_approvals || '',
        building_permit: project.building_permit || 'not_started',
        mouldus_arriving_date: project.mouldus_arriving_date || '',
      })
      setDirty(false)
    }
  }, [project])

  // Load files
  useEffect(() => {
    if (!projectId) return
    supabase
      .from('pm_precon_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setFiles(data || []))
  }, [projectId])

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pm_projects')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', projectId)
      if (error) throw error
      toast.success('Pre-construction details saved')
      setDirty(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(trackingItem, file) {
    setUploading(true)
    try {
      const filePath = `precon/${projectId}/${trackingItem}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('pm-documents')
        .upload(filePath, file)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('pm-documents')
        .getPublicUrl(uploadData.path)

      const { error: dbErr } = await supabase.from('pm_precon_files').insert({
        project_id: projectId,
        tracking_item: trackingItem,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      if (dbErr) throw dbErr

      // Refresh files
      const { data: refreshed } = await supabase
        .from('pm_precon_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      setFiles(refreshed || [])
      toast.success(`Uploaded ${file.name}`)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteFile(file) {
    try {
      // Extract storage path from URL
      const urlParts = file.file_url.split('/pm-documents/')
      if (urlParts[1]) {
        await supabase.storage.from('pm-documents').remove([decodeURIComponent(urlParts[1])])
      }
      await supabase.from('pm_precon_files').delete().eq('id', file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success('File removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  function getFilesForItem(key) {
    return files.filter(f => f.tracking_item === key)
  }

  const completedCount = TRACKING_ITEMS.filter(item => {
    const val = form[item.key]
    return val === 'completed' || val === 'demolished' || val === 'approved' || val === 'not_required'
  }).length

  const totalFiles = files.length

  return (
    <div className="space-y-6">
      {/* Header with Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Pre-Construction Checklist</h3>
          <Badge variant={completedCount === TRACKING_ITEMS.length ? 'success' : 'warning'}>
            {completedCount}/{TRACKING_ITEMS.length} Complete
          </Badge>
          {totalFiles > 0 && (
            <Badge variant="info">
              <Paperclip className="h-3 w-3 mr-1 inline" />
              {totalFiles} file{totalFiles !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-void hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Settlement & Permit Info */}
      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Settlement & Permit</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Settlement Date</label>
            <input
              type="text"
              value={form.settlement_date}
              onChange={e => updateField('settlement_date', e.target.value)}
              placeholder="e.g. stock, Apr-26"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Permit Required</label>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => updateField('permit_required', false)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  !form.permit_required
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface border border-border text-white/40 hover:text-white/60'
                }`}
              >
                No
              </button>
              <button
                onClick={() => updateField('permit_required', true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  form.permit_required
                    ? 'bg-amber/20 text-amber border border-amber/30'
                    : 'bg-surface border border-border text-white/40 hover:text-white/60'
                }`}
              >
                Yes
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Mouldus Arriving Date</label>
            <input
              type="text"
              value={form.mouldus_arriving_date}
              onChange={e => updateField('mouldus_arriving_date', e.target.value)}
              placeholder="e.g. late April / early May 26"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors"
            />
          </div>
        </div>
        <div className="px-5 pb-5">
          <label className="block text-xs font-medium text-white/40 mb-1.5">Application Lodged / Received Notes</label>
          <textarea
            value={form.permit_notes}
            onChange={e => updateField('permit_notes', e.target.value)}
            rows={3}
            placeholder="Notes about permit application, lodgement dates, council meetings..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Tracking Items Grid */}
      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Approvals & Compliance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {TRACKING_ITEMS.map(item => (
            <TrackingCard
              key={item.key}
              item={item}
              value={form[item.key] || 'not_started'}
              files={getFilesForItem(item.key)}
              onStatusChange={updateField}
              onUpload={handleUpload}
              onDeleteFile={handleDeleteFile}
              uploading={uploading}
            />
          ))}
        </div>
      </div>

      {/* Other Approvals */}
      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Other Notes</h3>
        </div>
        <div className="p-5">
          <textarea
            value={form.other_approvals}
            onChange={e => updateField('other_approvals', e.target.value)}
            rows={3}
            placeholder="Any other approvals, issues, or notes (tree removal, arborist reports, etc.)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  )
}
