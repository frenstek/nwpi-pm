import { useState, useEffect, useRef } from 'react'
import {
  Upload, Trash2, ExternalLink, FileText, Search, X,
  FolderOpen, Plus, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'ndis', label: 'NDIS / SDA' },
  { value: 'building_codes', label: 'Building Codes' },
  { value: 'templates', label: 'Templates' },
  { value: 'guides', label: 'Guides & Manuals' },
  { value: 'legal', label: 'Legal / Compliance' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS = {
  general: 'default',
  ndis: 'info',
  building_codes: 'warning',
  templates: 'success',
  guides: 'purple',
  legal: 'danger',
  other: 'default',
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function loadResources() {
    setLoading(true)
    const { data } = await supabase
      .from('pm_resources')
      .select('*')
      .order('created_at', { ascending: false })
    setResources(data || [])
    setLoading(false)
  }

  useEffect(() => { loadResources() }, [])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !name.trim()) return
    setUploading(true)
    try {
      const storagePath = `resources/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._()-]/g, '_')}`
      const { data: upData, error: upErr } = await supabase.storage
        .from('pm-documents')
        .upload(storagePath, file, { contentType: file.type })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('pm-documents').getPublicUrl(upData.path)

      const { error: dbErr } = await supabase.from('pm_resources').insert({
        name: name.trim(),
        category,
        description: description.trim() || null,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      if (dbErr) throw dbErr

      toast.success('Resource uploaded')
      setShowForm(false)
      setName('')
      setCategory('general')
      setDescription('')
      setFile(null)
      loadResources()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(resource) {
    setDeleting(resource.id)
    try {
      const urlParts = resource.file_url.split('/pm-documents/')
      if (urlParts[1]) {
        await supabase.storage.from('pm-documents').remove([decodeURIComponent(urlParts[1])])
      }
      await supabase.from('pm_resources').delete().eq('id', resource.id)
      setResources(prev => prev.filter(r => r.id !== resource.id))
      toast.success('Resource deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = resources.filter(r => {
    if (catFilter !== 'all' && r.category !== catFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.file_name || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display text-white">Resources</h1>
        <p className="text-sm text-white/40 mt-0.5">Reference documents, standards, guidelines & templates</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setCatFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              catFilter === 'all' ? 'bg-amber/15 text-amber' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                catFilter === c.value ? 'bg-amber/15 text-amber' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-48 rounded-lg border border-border bg-surface py-2 pr-8 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors"
              style={{ paddingLeft: '2.5rem' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          description={search ? 'Try a different search term.' : 'Upload your first reference document.'}
          action={{ label: 'Upload Resource', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="group bg-void-light border border-border rounded-xl p-5 hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber/10 text-amber shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{r.name}</h3>
                    <p className="text-[11px] text-white/30 truncate">{r.file_name}</p>
                  </div>
                </div>
              </div>
              {r.description && (
                <p className="text-xs text-white/40 mb-3 line-clamp-2">{r.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={CATEGORY_COLORS[r.category] || 'default'}>
                    {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
                  </Badge>
                  {r.file_size > 0 && (
                    <span className="text-[10px] text-white/20">{formatBytes(r.file_size)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-white/25 hover:text-amber hover:bg-amber/10 transition-colors"
                    title="Download"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deleting === r.id}
                    className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/15 mt-2">{formatDate(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Upload Resource" size="md">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. SDA Design Standards 2019"
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="form-input">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the document..."
              className="form-input resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">File *</label>
            <input
              ref={fileRef}
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="form-input file:mr-3 file:rounded-lg file:border-0 file:bg-amber/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-amber"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={uploading || !file || !name.trim()}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
