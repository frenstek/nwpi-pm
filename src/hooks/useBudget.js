import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBudget() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBudgetCategories = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_budget_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (err) throw err
      setCategories(data || [])
      return data || []
    } catch (err) {
      console.error('fetchBudgetCategories error:', err)
      setError(err)
      setCategories([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createBudgetCategory = useCallback(async (data) => {
    setError(null)
    try {
      const { data: category, error: err } = await supabase
        .from('pm_budget_categories')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return category
    } catch (err) {
      console.error('createBudgetCategory error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateBudgetCategory = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: category, error: err } = await supabase
        .from('pm_budget_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return category
    } catch (err) {
      console.error('updateBudgetCategory error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteBudgetCategory = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_budget_categories')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteBudgetCategory error:', err)
      setError(err)
      throw err
    }
  }, [])

  const fetchBudgetItems = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_budget_items')
        .select('*, pm_budget_categories(name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (err) throw err
      setItems(data || [])
      return data || []
    } catch (err) {
      console.error('fetchBudgetItems error:', err)
      setError(err)
      setItems([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createBudgetItem = useCallback(async (data) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_budget_items')
        .insert([data])
        .select('*, pm_budget_categories(name)')
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('createBudgetItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateBudgetItem = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_budget_items')
        .update(updates)
        .eq('id', id)
        .select('*, pm_budget_categories(name)')
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('updateBudgetItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteBudgetItem = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_budget_items')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteBudgetItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    categories,
    items,
    loading,
    error,
    fetchBudgetCategories,
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    fetchBudgetItems,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
  }
}
