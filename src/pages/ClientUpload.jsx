import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { CloudUpload, Plus, Trash2, FileText, CheckCircle, XCircle, MapPin, Loader2, Save, MessageSquare } from 'lucide-react'

const API = '/api/client-uploads'

const CATEGORIES = [
  { key: 'floor_plan', label: 'Floor Plan', icon: '📐', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'engineering', label: 'Engineering Plan', icon: '⚙️', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { key: 'architecture', label: 'Architecture Plan', icon: '🏛️', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { key: 'soil_test', label: 'Soil Test', icon: '🧪', color: 'bg-green-50 border-green-200 text-green-800' },
  { key: 'other', label: 'Other Plans', icon: '📄', color: 'bg-gray-50 border-gray-200 text-gray-800' },
]

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ClientUpload() {
  const { token } = useParams()
  const [link, setLink] = useState(null)
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newAddress, setNewAddress] = useState('')
  const [addingProperty, setAddingProperty] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState({})
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [notes, setNotes] = useState({}) // { category: noteText }
  const [savingNotes, setSavingNotes] = useState(false)
  const [savedMessage, setSavedMessage] = useState(null)

  // Validate token
  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`${API}?action=validate&token=${token}`)
        if (!res.ok) {
          const err = await res.json()
          setError(err.error || 'Invalid link')
          return
        }
        const data = await res.json()
        setLink(data)
      } catch {
        setError('Unable to connect. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [token])

  // Load properties
  const loadProperties = useCallback(async () => {
    if (!link) return
    const res = await fetch(`${API}?action=properties&token=${token}`)
    if (res.ok) {
      const data = await res.json()
      setProperties(data)
      if (data.length > 0 && !selectedProperty) setSelectedProperty(data[0])
    }
  }, [link, token, selectedProperty])

  useEffect(() => { loadProperties() }, [loadProperties])

  // Load files and notes for selected property
  useEffect(() => {
    if (!selectedProperty) { setFiles([]); setNotes({}); return }
    async function loadFiles() {
      const res = await fetch(`${API}?action=files&token=${token}&property_id=${selectedProperty.id}`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data)
        // Load saved notes from property
        const res2 = await fetch(`${API}?action=get-notes&token=${token}&property_id=${selectedProperty.id}`)
        if (res2.ok) {
          const notesData = await res2.json()
          setNotes(notesData || {})
        }
      }
    }
    loadFiles()
  }, [selectedProperty, token])

  // Add property
  async function handleAddProperty(e) {
    e.preventDefault()
    if (!newAddress.trim()) return
    setAddingProperty(true)
    try {
      const res = await fetch(`${API}?action=add-property&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress.trim() }),
      })
      if (res.ok) {
        const prop = await res.json()
        setProperties(p => [...p, prop])
        setSelectedProperty(prop)
        setNewAddress('')
        setShowAddForm(false)
      }
    } catch {} finally { setAddingProperty(false) }
  }

  // Upload file
  async function handleUpload(category, fileList) {
    for (const file of fileList) {
      const key = `${selectedProperty.id}-${category}-${file.name}`
      setUploading(u => ({ ...u, [key]: true }))
      try {
        const reader = new FileReader()
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const res = await fetch(`${API}?action=upload&token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: selectedProperty.id,
            category,
            file_name: file.name,
            file_data: base64,
            content_type: file.type,
          }),
        })
        if (res.ok) {
          const uploaded = await res.json()
          setFiles(f => [uploaded, ...f])
          setUploadSuccess(file.name)
          setTimeout(() => setUploadSuccess(null), 3000)
        }
      } catch {} finally {
        setUploading(u => { const n = { ...u }; delete n[key]; return n })
      }
    }
  }

  // Update note for a category
  function handleNoteChange(category, value) {
    setNotes(n => ({ ...n, [category]: value }))
  }

  // Save all notes
  async function handleSaveNotes() {
    if (!selectedProperty) return
    setSavingNotes(true)
    try {
      const res = await fetch(`${API}?action=save-notes&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedProperty.id, notes }),
      })
      if (res.ok) {
        setSavedMessage('Saved successfully')
        setTimeout(() => setSavedMessage(null), 3000)
      }
    } catch {} finally { setSavingNotes(false) }
  }

  // Delete file
  async function handleDelete(fileId) {
    if (!confirm('Delete this file?')) return
    const res = await fetch(`${API}?action=delete-file&token=${token}&file_id=${fileId}`, { method: 'DELETE' })
    if (res.ok) setFiles(f => f.filter(x => x.id !== fileId))
  }

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Available</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const categoryFiles = (cat) => files.filter(f => f.category === cat)

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1120] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500 text-white font-bold text-sm">NPI</div>
            <div>
              <h1 className="text-lg font-bold">Nationwide Projects</h1>
              <p className="text-sm text-gray-400">Document Upload Portal</p>
            </div>
          </div>
          {link && (
            <p className="text-sm text-gray-400 mt-2">Welcome, <span className="text-white font-medium">{link.client_name}</span></p>
          )}
        </div>
      </div>

      {/* Success toast */}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{uploadSuccess} uploaded</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Properties sidebar + content */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Properties list */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Properties</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddProperty} className="mb-4">
                  <input
                    type="text"
                    placeholder="Enter property address..."
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    style={{ backgroundColor: '#fff', color: '#1f2937' }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={addingProperty || !newAddress.trim()}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50"
                    >
                      {addingProperty ? 'Adding...' : 'Add Property'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setNewAddress('') }}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {properties.length === 0 && !showAddForm ? (
                <div className="text-center py-6">
                  <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-3">No properties yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                  >
                    Add Your First Property
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {properties.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProperty(p)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedProperty?.id === p.id
                          ? 'bg-amber-50 text-amber-800 font-medium border border-amber-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                        <span className="line-clamp-2">{p.address}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload area */}
          <div className="flex-1 min-w-0">
            {selectedProperty ? (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900">{selectedProperty.address}</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload documents for each category below. Accepted formats: PDF, DWG, DXF, images.</p>
                </div>

                <div className="space-y-4">
                  {CATEGORIES.map(cat => {
                    const catFiles = categoryFiles(cat.key)
                    return (
                      <CategorySection
                        key={cat.key}
                        category={cat}
                        files={catFiles}
                        uploading={uploading}
                        propertyId={selectedProperty.id}
                        onUpload={(files) => handleUpload(cat.key, files)}
                        onDelete={handleDelete}
                        note={notes[cat.key] || ''}
                        onNoteChange={(val) => handleNoteChange(cat.key, val)}
                      />
                    )
                  })}
                </div>

                {/* Save button */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingNotes ? 'Saving...' : 'Save'}
                  </button>
                  {savedMessage && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <CheckCircle className="h-4 w-4" /> {savedMessage}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                <div className="text-center">
                  <CloudUpload className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Select or add a property to start uploading</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-400 text-center">Nationwide Projects Investments Pty Ltd &mdash; Document Upload Portal</p>
        </div>
      </div>
    </div>
  )
}

function CategorySection({ category, files, uploading, propertyId, onUpload, onDelete, note, onNoteChange }) {
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files)
  }

  function handleFileInput(e) {
    if (e.target.files.length > 0) onUpload(e.target.files)
    e.target.value = ''
  }

  const isUploading = Object.keys(uploading).some(k => k.includes(propertyId) && k.includes(category.key))

  return (
    <div className={`bg-white rounded-xl border ${dragOver ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200'} overflow-hidden`}>
      {/* Category header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-100`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <h3 className="text-sm font-bold text-gray-900">{category.label}</h3>
          {files.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">{files.length}</span>
          )}
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors">
          <CloudUpload className="h-4 w-4" />
          Upload
          <input type="file" className="hidden" multiple onChange={handleFileInput} />
        </label>
      </div>

      {/* Drop zone + files */}
      <div
        className="px-4 py-3"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {isUploading && (
          <div className="flex items-center gap-2 text-sm mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Uploading file... please wait</span>
          </div>
        )}

        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg group" style={{ backgroundColor: '#f9fafb' }}>
                <FileText className="h-5 w-5 shrink-0" style={{ color: '#9ca3af' }} />
                <div className="flex-1 min-w-0">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate block" style={{ color: '#1f2937' }}>
                    {f.file_name}
                  </a>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{formatFileSize(f.file_size)} &middot; {new Date(f.uploaded_at).toLocaleDateString('en-AU')}</p>
                </div>
                <button
                  onClick={() => onDelete(f.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex flex-col items-center py-6 border-2 border-dashed rounded-lg transition-colors ${
            dragOver ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
          }`}>
            <CloudUpload className={`h-8 w-8 mb-2 ${dragOver ? 'text-amber-500' : 'text-gray-300'}`} />
            <p className="text-sm text-gray-400">Drag & drop files here</p>
          </div>
        )}

        {/* Notes */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Notes</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Add notes for ${category.label}...`}
            rows={2}
            style={{ backgroundColor: '#fff', color: '#1f2937', borderColor: '#e5e7eb' }}
            className="w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none border"
          />
        </div>
      </div>
    </div>
  )
}
