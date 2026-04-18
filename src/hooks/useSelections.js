import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSelections() {
  const [selections, setSelections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSelections = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_selections')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true })

      if (err) throw err
      setSelections(data || [])
      return data || []
    } catch (err) {
      console.error('fetchSelections error:', err)
      setError(err)
      setSelections([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createSelection = useCallback(async (data) => {
    setError(null)
    try {
      const { data: selection, error: err } = await supabase
        .from('pm_selections')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return selection
    } catch (err) {
      console.error('createSelection error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateSelection = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: selection, error: err } = await supabase
        .from('pm_selections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return selection
    } catch (err) {
      console.error('updateSelection error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteSelection = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_selections')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteSelection error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    selections,
    loading,
    error,
    fetchSelections,
    createSelection,
    updateSelection,
    deleteSelection,
  }
}
