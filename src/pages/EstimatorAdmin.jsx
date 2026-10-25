import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/estimatorConfig'

const CONFIG_KEY = 'npi-estimator-config'
const ITEM_TYPES = [
  { id: 'text', label: 'Text Input' },
  { id: 'date', label: 'Date' },
  { id: 'choice', label: 'Standard / Upgrade' },
  { id: 'options', label: 'Multi-Option' },
  { id: 'textarea', label: 'Text Area' },
]

const ICON_OPTIONS = [
  'user', 'building', 'blueprint', 'foundation', 'door', 'window', 'kitchen',
  'bath', 'laundry', 'closet', 'paint', 'floor', 'home', 'thermometer',
  'zap', 'truck', 'tree', 'leaf', 'note', 'clipboard', 'shield',
]

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export default function EstimatorAdmin() {
  const [categories, setCategories] = useState([])
  const [editingCat, setEditingCat] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCatIdx, setEditingCatIdx] = useState(null)
  const [expandedCat, setExpandedCat] = useState(null)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // Load config (server first, then local, then default)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const data = await res.json()
          if (data && data.config) {
            setCategories(data.config)
            localStorage.setItem(CONFIG_KEY, JSON.stringify(data.config))
            return
          }
        }
      } catch {}
      // Fallback to local
      try {
        const stored = localStorage.getItem(CONFIG_KEY)
        if (stored) {
          setCategories(JSON.parse(stored))
          return
        }
      } catch {}
      setCategories(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)))
    })()
  }, [])

  // Save (local + server)
  const handleSave = useCallback(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(categories))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Sync to server
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: categories, updated_by: 'admin' }),
    }).catch(() => {})
  }, [categories])

  // Reset to default
  const handleReset = () => {
    localStorage.removeItem(CONFIG_KEY)
    setCategories(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)))
    setConfirmReset(false)
    setSaved(false)
  }

  // Export config
  const [exported, setExported] = useState(false)
  const handleExport = async () => {
    const json = JSON.stringify(categories, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    } catch {
      // Fallback: download as file
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `npi-questionnaire-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }
  }

  // Import config
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText)
      if (!Array.isArray(parsed)) throw new Error('Must be an array')
      if (!parsed.every(c => c.id && c.title && Array.isArray(c.items))) throw new Error('Invalid format')
      setCategories(parsed)
      localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed))
      setShowImport(false)
      setImportText('')
      setImportError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setImportError(err.message || 'Invalid JSON')
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImportText(ev.target.result)
    }
    reader.readAsText(file)
  }

  // Category CRUD
  const addCategory = () => {
    const newCat = { id: `cat_${generateId()}`, title: 'New Section', icon: 'note', items: [] }
    setCategories(prev => [...prev, newCat])
    setExpandedCat(categories.length)
  }

  const deleteCategory = (idx) => {
    if (!window.confirm(`Delete "${categories[idx].title}" and all its items?`)) return
    setCategories(prev => prev.filter((_, i) => i !== idx))
    setExpandedCat(null)
  }

  const moveCat = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= categories.length) return
    setCategories(prev => {
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
    setExpandedCat(newIdx)
  }

  const updateCategory = (idx, updates) => {
    setCategories(prev => prev.map((cat, i) => i === idx ? { ...cat, ...updates } : cat))
  }

  // Item CRUD
  const addItem = (catIdx) => {
    const newItem = { id: `item_${generateId()}`, label: 'New Item', type: 'text' }
    setCategories(prev => prev.map((cat, i) =>
      i === catIdx ? { ...cat, items: [...cat.items, newItem] } : cat
    ))
  }

  const deleteItem = (catIdx, itemIdx) => {
    setCategories(prev => prev.map((cat, i) =>
      i === catIdx ? { ...cat, items: cat.items.filter((_, j) => j !== itemIdx) } : cat
    ))
  }

  const moveItem = (catIdx, itemIdx, dir) => {
    const newIdx = itemIdx + dir
    const items = categories[catIdx].items
    if (newIdx < 0 || newIdx >= items.length) return
    setCategories(prev => prev.map((cat, i) => {
      if (i !== catIdx) return cat
      const arr = [...cat.items]
      ;[arr[itemIdx], arr[newIdx]] = [arr[newIdx], arr[itemIdx]]
      return { ...cat, items: arr }
    }))
  }

  const updateItem = (catIdx, itemIdx, updates) => {
    setCategories(prev => prev.map((cat, i) =>
      i === catIdx
        ? { ...cat, items: cat.items.map((item, j) => j === itemIdx ? { ...item, ...updates } : item) }
        : cat
    ))
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/estimator" className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-bold">Questionnaire Builder</h1>
              <p className="text-[10px] text-white/40">{categories.length} sections</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowImport(true)}
              className="px-2.5 py-1.5 text-[11px] font-medium text-white/40 border border-white/10 hover:border-white/30 hover:text-white transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className={`px-2.5 py-1.5 text-[11px] font-medium border transition-colors ${
                exported
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'text-white/40 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {exported ? 'Copied!' : 'Export'}
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className="px-2.5 py-1.5 text-[11px] font-medium text-white/40 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#E8850C] text-white hover:bg-[#d47a0b]'
              }`}
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-32">
        {categories.map((cat, catIdx) => (
          <div key={cat.id} className="border border-white/10 overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => setExpandedCat(expandedCat === catIdx ? null : catIdx)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                expandedCat === catIdx ? 'bg-white/5' : 'hover:bg-white/[0.02]'
              }`}
            >
              <span className="text-[10px] font-mono text-white/20 w-5">{String(catIdx + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-sm font-medium truncate">{cat.title}</span>
              <span className="text-[10px] text-white/30">{cat.items.length} items</span>
              <svg className={`w-4 h-4 text-white/30 transition-transform ${expandedCat === catIdx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Expanded content */}
            {expandedCat === catIdx && (
              <div className="border-t border-white/5">
                {/* Category controls */}
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cat.title}
                      onChange={(e) => updateCategory(catIdx, { title: e.target.value })}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-[#E8850C]"
                      placeholder="Section title"
                    />
                    <select
                      value={cat.icon}
                      onChange={(e) => updateCategory(catIdx, { icon: e.target.value })}
                      className="px-2 py-2 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#E8850C]"
                    >
                      {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveCat(catIdx, -1)} disabled={catIdx === 0} className="px-2 py-1 text-[10px] border border-white/10 text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                      Move Up
                    </button>
                    <button onClick={() => moveCat(catIdx, 1)} disabled={catIdx === categories.length - 1} className="px-2 py-1 text-[10px] border border-white/10 text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                      Move Down
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => deleteCategory(catIdx)} className="px-2 py-1 text-[10px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                      Delete Section
                    </button>
                  </div>
                </div>

                {/* Items list */}
                <div className="divide-y divide-white/5">
                  {cat.items.map((item, itemIdx) => (
                    <div key={item.id} className="px-4 py-3">
                      {editingItem?.catIdx === catIdx && editingItem?.itemIdx === itemIdx ? (
                        <ItemEditor
                          item={item}
                          onUpdate={(updates) => { updateItem(catIdx, itemIdx, updates); }}
                          onClose={() => setEditingItem(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveItem(catIdx, itemIdx, -1)} disabled={itemIdx === 0} className="text-white/20 hover:text-white disabled:opacity-20">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                            </button>
                            <button onClick={() => moveItem(catIdx, itemIdx, 1)} disabled={itemIdx === cat.items.length - 1} className="text-white/20 hover:text-white disabled:opacity-20">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{item.label}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {ITEM_TYPES.find(t => t.id === item.type)?.label || item.type}
                              {item.required && ' · Required'}
                              {item.type === 'options' && item.options ? ` · ${item.options.length} options` : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => setEditingItem({ catIdx, itemIdx })}
                            className="p-1.5 text-white/30 hover:text-[#E8850C] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                          </button>
                          <button
                            onClick={() => deleteItem(catIdx, itemIdx)}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <button
                  onClick={() => addItem(catIdx)}
                  className="w-full px-4 py-3 text-sm text-white/30 hover:text-[#E8850C] hover:bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Item
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add section */}
        <button
          onClick={addCategory}
          className="w-full px-4 py-4 border border-dashed border-white/10 text-sm text-white/30 hover:text-[#E8850C] hover:border-[#E8850C]/40 flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Section
        </button>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImport(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 p-5 max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white">Import Configuration</h3>
            <p className="text-xs text-white/40">Paste the exported JSON below, or upload a JSON file.</p>

            <label className="block">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Upload File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="mt-1 block w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:border file:border-white/10 file:bg-white/5 file:text-white/60 file:text-xs file:cursor-pointer hover:file:bg-white/10"
              />
            </label>

            <div>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Or Paste JSON</span>
              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
                rows={8}
                className="mt-1 w-full px-3 py-2 bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#E8850C] resize-none"
                placeholder='[{"id":"client","title":"Client Information",...}]'
              />
            </div>

            {importError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{importError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowImport(false); setImportText(''); setImportError(''); }} className="px-3 py-1.5 text-xs border border-white/10 text-white/50 hover:text-white">Cancel</button>
              <button onClick={handleImport} disabled={!importText.trim()} className="px-4 py-1.5 text-xs font-bold bg-[#E8850C] text-white hover:bg-[#d47a0b] disabled:opacity-30">Import & Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmReset(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white">Reset to Default?</h3>
            <p className="text-xs text-white/50">This will discard all your customizations and restore the original questionnaire configuration.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs border border-white/10 text-white/50 hover:text-white">Cancel</button>
              <button onClick={handleReset} className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Item Editor ─────────────────────────────────────────────────────────────

function ItemEditor({ item, onUpdate, onClose }) {
  const [form, setForm] = useState({ ...item })

  const save = () => {
    onUpdate(form)
    onClose()
  }

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // Options management
  const addOption = () => {
    const opts = form.options || []
    updateForm('options', [...opts, { id: `opt_${generateId()}`, label: 'New Option' }])
  }

  const updateOption = (idx, updates) => {
    const opts = [...(form.options || [])]
    opts[idx] = { ...opts[idx], ...updates }
    updateForm('options', opts)
  }

  const deleteOption = (idx) => {
    updateForm('options', (form.options || []).filter((_, i) => i !== idx))
  }

  const moveOption = (idx, dir) => {
    const opts = [...(form.options || [])]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= opts.length) return
    ;[opts[idx], opts[newIdx]] = [opts[newIdx], opts[idx]]
    updateForm('options', opts)
  }

  return (
    <div className="space-y-3 bg-white/[0.02] -mx-4 -my-3 p-4 border-l-2 border-[#E8850C]">
      {/* Label */}
      <input
        type="text"
        value={form.label}
        onChange={(e) => updateForm('label', e.target.value)}
        className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-[#E8850C]"
        placeholder="Item label"
      />

      {/* Type + Required */}
      <div className="flex gap-2">
        <select
          value={form.type}
          onChange={(e) => updateForm('type', e.target.value)}
          className="flex-1 px-3 py-2 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#E8850C]"
        >
          {ITEM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 border border-white/10 text-xs text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={form.required || false}
            onChange={(e) => updateForm('required', e.target.checked)}
            className="accent-[#E8850C]"
          />
          Required
        </label>
      </div>

      {/* Text-specific */}
      {(form.type === 'text' || form.type === 'date') && (
        <input
          type="text"
          value={form.placeholder || ''}
          onChange={(e) => updateForm('placeholder', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#E8850C]"
          placeholder="Placeholder text"
        />
      )}

      {/* Choice-specific */}
      {form.type === 'choice' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.standard || ''}
              onChange={(e) => updateForm('standard', e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-emerald-500"
              placeholder="Standard option"
            />
            <input
              type="text"
              value={form.upgrade || ''}
              onChange={(e) => updateForm('upgrade', e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#E8850C]"
              placeholder="Upgrade option"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.standardLabel || ''}
              onChange={(e) => updateForm('standardLabel', e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 text-[10px] outline-none focus:border-emerald-500"
              placeholder="Standard label (optional)"
            />
            <input
              type="text"
              value={form.upgradeLabel || ''}
              onChange={(e) => updateForm('upgradeLabel', e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 text-[10px] outline-none focus:border-[#E8850C]"
              placeholder="Upgrade label (optional)"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasWriteIn || false}
              onChange={(e) => updateForm('hasWriteIn', e.target.checked)}
              className="accent-[#E8850C]"
            />
            Has write-in field
          </label>
          {form.hasWriteIn && (
            <input
              type="text"
              value={form.writeInLabel || ''}
              onChange={(e) => updateForm('writeInLabel', e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white text-[10px] outline-none focus:border-[#E8850C]"
              placeholder="Write-in label"
            />
          )}
        </div>
      )}

      {/* Options-specific */}
      {form.type === 'options' && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Options</p>
          {(form.options || []).map((opt, idx) => (
            <div key={opt.id || idx} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveOption(idx, -1)} disabled={idx === 0} className="text-white/20 hover:text-white disabled:opacity-20">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                </button>
                <button onClick={() => moveOption(idx, 1)} disabled={idx === (form.options || []).length - 1} className="text-white/20 hover:text-white disabled:opacity-20">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>
              <input
                type="text"
                value={opt.id}
                onChange={(e) => updateOption(idx, { id: e.target.value })}
                className="w-20 px-2 py-1.5 bg-black/40 border border-white/10 text-white/40 text-[10px] font-mono outline-none focus:border-[#E8850C]"
                placeholder="id"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(idx, { label: e.target.value })}
                className="flex-1 px-2 py-1.5 bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#E8850C]"
                placeholder="Label"
              />
              <button onClick={() => deleteOption(idx)} className="p-1 text-white/20 hover:text-red-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addOption} className="text-[10px] text-[#E8850C] hover:text-[#d47a0b] flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Option
          </button>
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="px-3 py-1.5 text-[11px] border border-white/10 text-white/40 hover:text-white transition-colors">
          Cancel
        </button>
        <button onClick={save} className="px-4 py-1.5 text-[11px] font-bold bg-[#E8850C] text-white hover:bg-[#d47a0b] transition-colors">
          Apply
        </button>
      </div>
    </div>
  )
}
