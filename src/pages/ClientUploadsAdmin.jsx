import { useState, useEffect, useCallback } from 'react'
import { CloudUpload, Plus, Link2, Copy, Check, ChevronDown, ChevronRight, FileText, MapPin, ExternalLink, ToggleLeft, ToggleRight, Loader2, Download, Trash2, RefreshCw } from 'lucide-react'

const API = '/api/client-uploads'
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''

const CATEGORY_LABELS = {
  floor_plan: 'Floor Plan',
  engineering: 'Engineering Plan',
  architecture: 'Architecture Plan',
  soil_test: 'Soil Test',
  other: 'Other Plans',
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function timeAgo(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function ClientUploadsAdmin() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [expandedLink, setExpandedLink] = useState(null)
  const [linkData, setLinkData] = useState({}) // { linkId: { properties, files } }
  const [loadingData, setLoadingData] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load all links
  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch(`${API}?action=admin-links`)
      if (res.ok) setLinks(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadLinks() }, [loadLinks])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      loadLinks()
      // Also refresh expanded link data
      if (expandedLink) loadLinkData(expandedLink)
    }, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, expandedLink, loadLinks])

  // Load data for a specific link
  async function loadLinkData(linkId) {
    setLoadingData(d => ({ ...d, [linkId]: true }))
    try {
      const res = await fetch(`${API}?action=admin-uploads&link_id=${linkId}`)
      if (res.ok) {
        const data = await res.json()
        setLinkData(d => ({ ...d, [linkId]: data }))
      }
    } catch {} finally { setLoadingData(d => ({ ...d, [linkId]: false })) }
  }

  // Toggle expand
  function handleExpand(linkId) {
    if (expandedLink === linkId) {
      setExpandedLink(null)
    } else {
      setExpandedLink(linkId)
      if (!linkData[linkId]) loadLinkData(linkId)
    }
  }

  // Create link
  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API}?action=admin-create-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: newName.trim(), client_email: newEmail.trim() || null }),
      })
      if (res.ok) {
        const link = await res.json()
        setLinks(l => [link, ...l])
        setNewName('')
        setNewEmail('')
        setShowCreate(false)
      }
    } catch {} finally { setCreating(false) }
  }

  // Toggle active
  async function handleToggle(linkId, currentActive) {
    const res = await fetch(`${API}?action=admin-toggle-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId, is_active: !currentActive }),
    })
    if (res.ok) {
      setLinks(l => l.map(x => x.id === linkId ? { ...x, is_active: !currentActive } : x))
    }
  }

  // Copy link
  function handleCopy(token) {
    navigator.clipboard.writeText(`${SITE_URL}/client-upload/${token}`)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Uploads</h1>
          <p className="text-sm text-slate-400 mt-1">Manage upload links and view client-submitted documents</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadLinks(); if (expandedLink) loadLinkData(expandedLink) }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
            <span className="text-xs text-slate-400">Auto-refresh</span>
            <button onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh
                ? <ToggleRight className="h-5 w-5 text-green-400" />
                : <ToggleLeft className="h-5 w-5 text-slate-500" />
              }
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber hover:bg-amber/90 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> New Upload Link
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Create Upload Link</h3>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Client Name *</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-amber outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-amber outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-amber hover:bg-amber/90 rounded-lg disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNewName(''); setNewEmail('') }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-amber animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <CloudUpload className="h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium mb-2">No upload links yet</p>
          <p className="text-sm text-slate-500 mb-4">Create a link to share with your client</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-amber hover:bg-amber/90 rounded-lg"
          >
            Create First Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => {
            const isExpanded = expandedLink === link.id
            const data = linkData[link.id]
            const isLoadingData = loadingData[link.id]
            const propCount = link.pm_upload_properties?.[0]?.count || 0
            const fileCount = link.pm_client_uploads?.[0]?.count || 0

            return (
              <div key={link.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                {/* Link header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => handleExpand(link.id)}>
                  <div className="shrink-0">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white">{link.client_name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${link.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {link.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      {link.client_email && <span>{link.client_email}</span>}
                      <span>{propCount} properties</span>
                      <span>{fileCount} files</span>
                      <span>Created {timeAgo(link.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopy(link.token)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Copy upload link"
                    >
                      {copiedId === link.token ? <><Check className="h-3.5 w-3.5 text-green-400" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Link</>}
                    </button>
                    <a
                      href={`/client-upload/${link.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="Open upload page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleToggle(link.id, link.is_active)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title={link.is_active ? 'Disable link' : 'Enable link'}
                    >
                      {link.is_active ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-700 px-5 py-4">
                    {isLoadingData ? (
                      <div className="flex items-center gap-2 py-4 text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading uploads...
                      </div>
                    ) : !data || data.properties.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4">No properties added by client yet.</p>
                    ) : (
                      <div className="space-y-5">
                        {data.properties.map(prop => {
                          const propFiles = data.files.filter(f => f.property_id === prop.id)
                          const propNotes = prop.notes || {}
                          return (
                            <div key={prop.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="h-4 w-4 text-amber" />
                                <h4 className="text-sm font-bold text-white">{prop.address}</h4>
                                <span className="text-xs text-slate-500">{propFiles.length} files</span>
                              </div>

                              {/* Group files by category */}
                              {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                                const catFiles = propFiles.filter(f => f.category === catKey)
                                const catNote = propNotes[catKey]
                                if (catFiles.length === 0 && !catNote) return null
                                return (
                                  <div key={catKey} className="mb-3 last:mb-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{catLabel}</p>
                                    {catFiles.length > 0 && (
                                      <div className="space-y-1 mb-2">
                                        {catFiles.map(f => (
                                          <div key={f.id} className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg">
                                            <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-200 hover:text-amber truncate block">
                                                {f.file_name}
                                              </a>
                                              <p className="text-xs text-slate-500">{formatFileSize(f.file_size)} &middot; {timeAgo(f.uploaded_at)}</p>
                                            </div>
                                            <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-500 hover:text-white" title="Download">
                                              <Download className="h-4 w-4" />
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {catNote && (
                                      <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <p className="text-xs text-slate-400 font-medium mb-0.5">Client Note:</p>
                                        <p className="text-sm text-slate-200">{catNote}</p>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {propFiles.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No files uploaded for this property yet.</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <p className="text-xs text-slate-600 text-center">Auto-refreshing every 15 seconds</p>
      )}
    </div>
  )
}
