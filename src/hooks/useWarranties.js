import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWarranties() {
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWarranties = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_warranties')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setWarranties(data || [])
      return data || []
    } catch (err) {
      console.error('fetchWarranties error:', err)
      setError(err)
      setWarranties([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createWarranty = useCallback(async (data) => {
    setError(null)
    try {
      const { data: warranty, error: err } = await supabase
        .from('pm_warranties')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return warranty
    } catch (err) {
      console.error('createWarranty error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateWarranty = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: warranty, error: err } = await supabase
        .from('pm_warranties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return warranty
    } catch (err) {
      console.error('updateWarranty error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteWarranty = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_warranties')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteWarranty error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    warranties,
    loading,
    error,
    fetchWarranties,
    createWarranty,
    updateWarranty,
    deleteWarranty,
  }
}
