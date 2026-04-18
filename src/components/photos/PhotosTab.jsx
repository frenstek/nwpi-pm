import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePhotos } from '../../hooks/usePhotos'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import PhotoUploadForm from './PhotoUploadForm'
import PhotoViewer from './PhotoViewer'

function groupPhotosByDate(photos) {
  const groups = {}
  for (const photo of photos) {
    const date = photo.taken_at ? photo.taken_at.split('T')[0] : 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(photo)
  }
  // Sort dates descending
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function PhotosTab({ projectId }) {
  const { photos, loading, fetchPhotos, createPhoto, deletePhoto, uploadPhoto } = usePhotos()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)

  useEffect(() => {
    fetchPhotos(projectId)
  }, [projectId, fetchPhotos])

  const groupedPhotos = useMemo(() => groupPhotosByDate(photos), [photos])

  // Flat list for lightbox navigation
  const flatPhotos = useMemo(() => {
    const result = []
    for (const [, group] of groupedPhotos) {
      result.push(...group)
    }
    return result
  }, [groupedPhotos])

  function openViewer(photo) {
    const idx = flatPhotos.findIndex(p => p.id === photo.id)
    setViewerIndex(idx >= 0 ? idx : 0)
  }

  async function handleSubmit(formData) {
    setSaving(true)
    try {
      if (formData.files && formData.files.length > 0) {
        // Upload multiple files
        for (const file of formData.files) {
          let photoUrl
          try {
            photoUrl = await uploadPhoto(projectId, file)
          } catch (uploadErr) {
            if (uploadErr.message?.includes('not found') || uploadErr.message?.includes('Bucket')) {
              toast.error('Storage bucket "pm-photos" not found. Please create it in Supabase or use a URL instead.')
              setSaving(false)
              return
            }
            throw uploadErr
          }

          await createPhoto({
            project_id: projectId,
            photo_url: photoUrl,
            caption: formData.caption,
            taken_at: formData.taken_at,
          })
        }
        toast.success(
          formData.files.length > 1
            ? `${formData.files.length} photos uploaded`
            : 'Photo uploaded'
        )
      } else if (formData.url) {
        await createPhoto({
          project_id: projectId,
          photo_url: formData.url,
          caption: formData.caption,
          taken_at: formData.taken_at,
        })
        toast.success('Photo added')
      }

      setShowForm(false)
      fetchPhotos(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e, photo) {
    e.stopPropagation()
    if (!confirm('Delete this photo?')) return
    try {
      await deletePhoto(photo.id)
      toast.success('Photo deleted')
      fetchPhotos(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to delete photo')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Upload Photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photos yet"
          description="Upload site photos to document progress and keep a visual record."
          action={{ label: 'Upload Photos', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-6">
          {groupedPhotos.map(([date, group]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-white/40 mb-3">
                {date === 'unknown' ? 'No date' : formatDate(date)}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => openViewer(photo)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-surface border border-border cursor-pointer hover:border-amber/40 transition-colors"
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'Project photo'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                    {/* Caption overlay at bottom */}
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                        <p className="text-xs text-white/80 line-clamp-2">{photo.caption}</p>
                      </div>
                    )}

                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => handleDelete(e, photo)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/0 group-hover:text-white/70 hover:!text-danger hover:bg-black/70 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Upload Photos"
        size="md"
      >
        <PhotoUploadForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      </Modal>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={flatPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
