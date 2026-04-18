import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePhotos() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPhotos = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data: photos, error: err } = await supabase
        .from('pm_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('taken_at', { ascending: false })

      if (err) throw err
      setData(photos || [])
      return photos || []
    } catch (err) {
      console.error('fetchPhotos error:', err)
      setError(err)
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createPhoto = useCallback(async (photoData) => {
    setError(null)
    try {
      const { data: photo, error: err } = await supabase
        .from('pm_photos')
        .insert([photoData])
        .select()
        .single()

      if (err) throw err
      return photo
    } catch (err) {
      console.error('createPhoto error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deletePhoto = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_photos')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deletePhoto error:', err)
      setError(err)
      throw err
    }
  }, [])

  const uploadPhoto = useCallback(async (projectId, file) => {
    try {
      const filePath = `${projectId}/${Date.now()}-${file.name}`
      const { data, error: err } = await supabase.storage
        .from('pm-photos')
        .upload(filePath, file)

      if (err) throw err

      const { data: urlData } = supabase.storage
        .from('pm-photos')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (err) {
      console.error('uploadPhoto error:', err)
      throw err
    }
  }, [])

  return {
    photos: data,
    loading,
    error,
    fetchPhotos,
    createPhoto,
    deletePhoto,
    uploadPhoto,
  }
}
