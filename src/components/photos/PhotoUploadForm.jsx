import { useState, useRef } from 'react'
import { Upload, Link as LinkIcon, ImagePlus, X } from 'lucide-react'
import Button from '../ui/Button'

function getTodayString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function PhotoUploadForm({ onSubmit, onCancel, loading }) {
  const [files, setFiles] = useState([])
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [takenAt, setTakenAt] = useState(getTodayString())
  const [inputMode, setInputMode] = useState('file')
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected])
    }
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (inputMode === 'file') {
      onSubmit({
        files,
        caption: caption || null,
        taken_at: takenAt,
      })
    } else {
      onSubmit({
        url,
        caption: caption || null,
        taken_at: takenAt,
      })
    }
  }

  const isValid = inputMode === 'file' ? files.length > 0 : url.trim().length > 0

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'
  const labelClass = 'block text-xs font-medium text-white/50 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            Upload Files
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
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg px-4 py-6 flex flex-col items-center gap-2 hover:border-amber/40 transition-colors cursor-pointer"
            >
              <ImagePlus className="h-6 w-6 text-white/30" />
              <p className="text-sm text-white/40">Click to select photos</p>
              <p className="text-xs text-white/20">Supports multiple files</p>
            </button>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between bg-surface rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                      />
                      <span className="text-xs text-white/60 truncate">{f.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 text-white/30 hover:text-danger transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-white/30">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              </div>
            )}
          </div>
        ) : (
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className={inputClass}
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Caption</label>
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Describe the photo..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Date Taken</label>
        <input
          type="date"
          value={takenAt}
          onChange={e => setTakenAt(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!isValid}>
          {inputMode === 'file' && files.length > 1
            ? `Upload ${files.length} Photos`
            : 'Upload Photo'
          }
        </Button>
      </div>
    </form>
  )
}
