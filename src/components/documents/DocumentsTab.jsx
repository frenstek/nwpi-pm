import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Download, FileText, FileImage, FileSpreadsheet,
  File, Filter, Eye, X, ExternalLink, HardHat,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useDocuments } from '../../hooks/useDocuments'
import { formatDate } from '../../lib/utils'
import { DOCUMENT_CATEGORIES } from '../../lib/constants'

const PRECON_ITEMS = [
  { value: 'demolition', label: 'Demolition' },
  { value: 'elec_abolishment', label: 'Electrical Abolishment' },
  { value: 'gas_abolishment', label: 'Gas Abolishment' },
  { value: 'engineering_status', label: 'Engineering' },
  { value: 'working_drawings', label: 'Working Drawings' },
  { value: 'fire_status', label: 'Fire' },
  { value: 'soil_test', label: 'Soil Test' },
  { value: 'building_permit', label: 'Building Permit' },
]
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import DocumentUploadForm from './DocumentUploadForm'

const categoryColors = {
  plans: 'info',
  permits: 'warning',
  contracts: 'success',
  reports: 'amber',
  other: 'neutral',
}

function getFileIcon(fileType, fileName) {
  const name = (fileName || '').toLowerCase()
  const type = (fileType || '').toLowerCase()

  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) {
    return FileImage
  }
  if (type.includes('spreadsheet') || type.includes('excel') || /\.(xlsx?|csv)$/.test(name)) {
    return FileSpreadsheet
  }
  if (type.includes('pdf') || /\.pdf$/.test(name)) {
    return FileText
  }
  return File
}

function canPreview(fileType, fileName) {
  const name = (fileName || '').toLowerCase()
  const type = (fileType || '').toLowerCase()
  if (type.includes('pdf') || /\.pdf$/.test(name)) return 'pdf'
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) return 'image'
  if (type.includes('word') || /\.(docx?|xlsx?|pptx?)$/.test(name)) return 'office'
  return null
}

function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentCard({ doc, onDelete, onView, onAddToPrecon }) {
  const Icon = getFileIcon(doc.file_type, doc.name)
  const catConfig = DOCUMENT_CATEGORIES.find(c => c.value === doc.category)
  const previewType = doc.file_url ? canPreview(doc.file_type, doc.name) : null

  return (
    <div className="bg-void-light border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-surface">
            <Icon className="h-5 w-5 text-white/40" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={categoryColors[doc.category] || 'neutral'}>
                {catConfig?.label || doc.category}
              </Badge>
              <span className="text-xs text-white/30">{formatFileSize(doc.file_size)}</span>
            </div>
          </div>
        </div>
      </div>

      {doc.notes && (
        <p className="text-xs text-white/40 line-clamp-2">{doc.notes}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-white/30">{formatDate(doc.created_at)}</span>
        <div className="flex items-center gap-1">
          {doc.file_url && previewType && (
            <button
              onClick={() => onView(doc)}
              className="p-1.5 rounded-lg text-white/30 hover:text-amber hover:bg-surface transition-colors cursor-pointer"
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          {doc.file_url && (
            <button
              onClick={() => onAddToPrecon(doc)}
              className="p-1.5 rounded-lg text-white/30 hover:text-info hover:bg-surface transition-colors cursor-pointer"
              title="Add to Pre-Construction"
            >
              <HardHat className="h-3.5 w-3.5" />
            </button>
          )}
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-white/30 hover:text-amber hover:bg-surface transition-colors"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onDelete(doc)}
            className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentViewer({ doc, onClose }) {
  if (!doc || !doc.file_url) return null

  const previewType = canPreview(doc.file_type, doc.name)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-5 w-0.5 rounded-full bg-amber" />
          <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
          <Badge variant={categoryColors[doc.category] || 'neutral'}>
            {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden p-4">
        {previewType === 'pdf' && (
          <iframe
            src={`${doc.file_url}#toolbar=1&navpanes=1`}
            className="w-full h-full rounded-lg border border-white/10"
            title={doc.name}
          />
        )}
        {previewType === 'image' && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={doc.file_url}
              alt={doc.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}
        {previewType === 'office' && (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.file_url)}`}
            className="w-full h-full rounded-lg border border-white/10"
            title={doc.name}
          />
        )}
      </div>
    </div>
  )
}

export default function DocumentsTab({ projectId }) {
  const { documents, loading, fetchDocuments, createDocument, deleteDocument, uploadFile } = useDocuments()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewingDoc, setViewingDoc] = useState(null)
  const [preconDoc, setPreconDoc] = useState(null)
  const [preconSaving, setPreconSaving] = useState(false)

  useEffect(() => {
    fetchDocuments(projectId)
  }, [projectId, fetchDocuments])

  // Close viewer on Escape
  useEffect(() => {
    if (!viewingDoc) return
    function handleKey(e) {
      if (e.key === 'Escape') setViewingDoc(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [viewingDoc])

  const filtered = categoryFilter === 'all'
    ? documents
    : documents.filter(d => d.category === categoryFilter)

  async function handleSubmit(formData) {
    setSaving(true)
    try {
      let fileUrl = formData.url
      let fileSize = formData.file_size
      let fileType = formData.file_type

      if (formData.file) {
        try {
          fileUrl = await uploadFile(projectId, formData.file)
        } catch (uploadErr) {
          if (uploadErr.message?.includes('not found') || uploadErr.message?.includes('Bucket')) {
            toast.error('Storage bucket "pm-documents" not found. Please create it in Supabase or use a URL instead.')
            setSaving(false)
            return
          }
          throw uploadErr
        }
      }

      await createDocument({
        project_id: projectId,
        name: formData.name,
        category: formData.category,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        notes: formData.notes,
      })

      toast.success('Document uploaded')
      setShowForm(false)
      fetchDocuments(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to upload document')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddToPrecon(trackingItem) {
    if (!preconDoc) return
    setPreconSaving(true)
    try {
      const { error } = await supabase.from('pm_precon_files').insert({
        project_id: projectId,
        tracking_item: trackingItem,
        file_name: preconDoc.name,
        file_url: preconDoc.file_url,
        file_size: preconDoc.file_size,
        file_type: preconDoc.file_type,
      })
      if (error) throw error
      toast.success(`Added "${preconDoc.name}" to ${PRECON_ITEMS.find(i => i.value === trackingItem)?.label}`)
      setPreconDoc(null)
    } catch (err) {
      toast.error(err.message || 'Failed to add to pre-construction')
    } finally {
      setPreconSaving(false)
    }
  }

  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.name}"?`)) return
    try {
      await deleteDocument(doc.id)
      toast.success('Document deleted')
      fetchDocuments(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to delete document')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/30" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-amber cursor-pointer"
          >
            <option value="all">All Categories</option>
            {DOCUMENT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <span className="text-sm text-white/40">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={categoryFilter !== 'all' ? 'No documents in this category' : 'No documents yet'}
          description="Upload plans, permits, contracts, and other project documents."
          action={categoryFilter === 'all' ? { label: 'Upload Document', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              onView={setViewingDoc}
              onAddToPrecon={setPreconDoc}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Upload Document"
        size="md"
      >
        <DocumentUploadForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      </Modal>

      {/* Full-screen Document Viewer */}
      {viewingDoc && (
        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}

      {/* Add to Pre-Construction Modal */}
      <Modal
        isOpen={!!preconDoc}
        onClose={() => setPreconDoc(null)}
        title="Add to Pre-Construction"
        size="sm"
      >
        {preconDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
              <FileText className="h-5 w-5 text-white/40 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{preconDoc.name}</p>
                <p className="text-xs text-white/30">{formatFileSize(preconDoc.file_size)}</p>
              </div>
            </div>

            <p className="text-xs text-white/50">Select which pre-construction item to attach this document to:</p>

            <div className="space-y-2">
              {PRECON_ITEMS.map(item => (
                <button
                  key={item.value}
                  onClick={() => handleAddToPrecon(item.value)}
                  disabled={preconSaving}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left hover:border-amber/40 hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
                >
                  <HardHat className="h-4 w-4 text-amber/60 flex-shrink-0" />
                  <span className="text-sm text-white/70">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
