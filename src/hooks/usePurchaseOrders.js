import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPurchaseOrders = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_purchase_orders')
        .select('*, pm_po_items(id)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (err) throw err

      // Add items_count to each PO
      const enriched = (data || []).map(po => ({
        ...po,
        items_count: po.pm_po_items?.length || 0,
      }))

      setPurchaseOrders(enriched)
      return enriched
    } catch (err) {
      console.error('fetchPurchaseOrders error:', err)
      setError(err)
      setPurchaseOrders([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPurchaseOrder = useCallback(async (id) => {
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_purchase_orders')
        .select('*, pm_po_items(*)')
        .eq('id', id)
        .single()

      if (err) throw err

      // Sort items by sort_order
      if (data?.pm_po_items) {
        data.pm_po_items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      }

      return data
    } catch (err) {
      console.error('fetchPurchaseOrder error:', err)
      setError(err)
      return null
    }
  }, [])

  const generatePONumber = useCallback(async (projectId) => {
    try {
      const { count, error: err } = await supabase
        .from('pm_purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if (err) throw err
      return `PO-${String((count || 0) + 1).padStart(3, '0')}`
    } catch (err) {
      console.error('generatePONumber error:', err)
      return `PO-${String(Date.now()).slice(-3)}`
    }
  }, [])

  const createPurchaseOrder = useCallback(async (data) => {
    setError(null)
    try {
      const { data: po, error: err } = await supabase
        .from('pm_purchase_orders')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return po
    } catch (err) {
      console.error('createPurchaseOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updatePurchaseOrder = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: po, error: err } = await supabase
        .from('pm_purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return po
    } catch (err) {
      console.error('updatePurchaseOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deletePurchaseOrder = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_purchase_orders')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deletePurchaseOrder error:', err)
      setError(err)
      throw err
    }
  }, [])

  const createPOItem = useCallback(async (data) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_po_items')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('createPOItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updatePOItem = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_po_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('updatePOItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deletePOItem = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_po_items')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deletePOItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
    fetchPurchaseOrder,
    generatePONumber,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    createPOItem,
    updatePOItem,
    deletePOItem,
  }
}
