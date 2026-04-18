import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useChangeOrders() {
  const [changeOrders, setChangeOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchChangeOrders = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setChangeOrders(data || [])
      return data || []
    } catch (err) {
      console.error('fetchChangeOrders error:', err)
      setError(err)
      setChangeOrders([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createChangeOrder = useCallback(async (data) => {
    setError(null)
    try {
      const { data: changeOrder, error: err } = await supabase
        .from('pm_change_orders')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return changeOrder
    } catch (err) {
      console.error('createChangeOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateChangeOrder = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: changeOrder, error: err } = await supabase
        .from('pm_change_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return changeOrder
    } catch (err) {
      console.error('updateChangeOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteChangeOrder = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_change_orders')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteChangeOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    changeOrders,
    loading,
    error,
    fetchChangeOrders,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
  }
}
