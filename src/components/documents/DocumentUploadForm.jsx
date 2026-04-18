import { useState, useRef } from 'react'
import { Upload, Link as LinkIcon } from 'lucide-react'
import { DOCUMENT_CATEGORIES } from '../../lib/constants'
import Button from '../ui/Button'

export default function DocumentUploadForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    category: 'other',
    notes: '',
    url: '',
  })
  const [file, setFile] = useState(null)
  const [inputMode, setInputMode] = useState('file') // 'file' or 'url'
  const fileRef = useRef(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      if (!form.name) {
        setForm(prev => ({ ...prev, name: selected.name }))
      }
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      name: form.name,
      category: form.category,
      notes: form.notes || null,
      url: inputMode === 'url' ? form.url : null,
      file: inputMode === 'file' ? file : null,
      file_size: file ? file.size : null,
      file_type: file ? file.type : null,
    })
  }

  const isValid = form.name.trim() && (
    (inputMode === 'file' && file) || (inputMode === 'url' && form.url.trim())
  )

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'
  const labelClass = 'block text-xs font-medium text-white/50 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Document Name *</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. Floor Plan Rev 3"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className={inputClass}
        >
          {DOCUMENT_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Source</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              inputMode === 'file'
                ? 'bg-amber/15 text-amber border border-amber/30'
                : 'bg-surface text-white/40 border border-border hover:text-white/60'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              inputMode === 'url'
                ? 'bg-amber/15 text-amber border border-amber/30'
                : 'bg-surface text-white/40 border border-border hover:text-white/60'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            URL
          </button>
        </div>

        {inputMode === 'file' ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg px-4 py-6 flex flex-col items-center gap-2 hover:border-amber/40 transition-colors cursor-pointer"
            >
              <Upload className="h-6 w-6 text-white/30" />
              {file ? (
                <div className="text-center">
                  <p className="text-sm text-white/70">{file.name}</p>
                  <p className="text-xs text-white/30">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <p className="text-sm text-white/40">Click to select a file</p>
              )}
            </button>
          </div>
        ) : (
          <input
            type="url"
            name="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://..."
            className={inputClass}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Optional notes about this document..."
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!isValid}>
          Upload Document
        </Button>
      </div>
    </form>
  )
}
