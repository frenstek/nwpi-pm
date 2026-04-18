import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDocuments() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDocuments = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data: docs, error: err } = await supabase
        .from('pm_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setData(docs || [])
      return docs || []
    } catch (err) {
      console.error('fetchDocuments error:', err)
      setError(err)
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createDocument = useCallback(async (docData) => {
    setError(null)
    try {
      const { data: doc, error: err } = await supabase
        .from('pm_documents')
        .insert([docData])
        .select()
        .single()

      if (err) throw err
      return doc
    } catch (err) {
      console.error('createDocument error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteDocument = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_documents')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteDocument error:', err)
      setError(err)
      throw err
    }
  }, [])

  const uploadFile = useCallback(async (projectId, file) => {
    try {
      const filePath = `${projectId}/${Date.now()}-${file.name}`
      const { data, error: err } = await supabase.storage
        .from('pm-documents')
        .upload(filePath, file)

      if (err) throw err

      const { data: urlData } = supabase.storage
        .from('pm-documents')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (err) {
      console.error('uploadFile error:', err)
      throw err
    }
  }, [])

  return {
    documents: data,
    loading,
    error,
    fetchDocuments,
    createDocument,
    deleteDocument,
    uploadFile,
  }
}
