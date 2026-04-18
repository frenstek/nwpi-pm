import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PhotoViewer({ photos, currentIndex, onClose, onNavigate }) {
  const photo = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white/60">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image + caption */}
      <div className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh]">
        <img
          src={photo.photo_url}
          alt={photo.caption || 'Project photo'}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.caption && (
          <p className="mt-3 text-sm text-white/70 text-center max-w-lg">{photo.caption}</p>
        )}
      </div>
    </div>
  )
}
