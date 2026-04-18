import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInvoices = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_invoices')
        .select('*, pm_invoice_items(id)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (err) throw err

      const enriched = (data || []).map(inv => ({
        ...inv,
        items_count: inv.pm_invoice_items?.length || 0,
      }))

      setInvoices(enriched)
      return enriched
    } catch (err) {
      console.error('fetchInvoices error:', err)
      setError(err)
      setInvoices([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInvoice = useCallback(async (id) => {
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_invoices')
        .select('*, pm_invoice_items(*)')
        .eq('id', id)
        .single()

      if (err) throw err

      if (data?.pm_invoice_items) {
        data.pm_invoice_items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      }

      return data
    } catch (err) {
      console.error('fetchInvoice error:', err)
      setError(err)
      return null
    }
  }, [])

  const generateInvoiceNumber = useCallback(async (projectId) => {
    try {
      const { count, error: err } = await supabase
        .from('pm_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if (err) throw err
      return `INV-${String((count || 0) + 1).padStart(3, '0')}`
    } catch (err) {
      console.error('generateInvoiceNumber error:', err)
      return `INV-${String(Date.now()).slice(-3)}`
    }
  }, [])

  const createInvoice = useCallback(async (data) => {
    setError(null)
    try {
      const { data: invoice, error: err } = await supabase
        .from('pm_invoices')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return invoice
    } catch (err) {
      console.error('createInvoice error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateInvoice = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: invoice, error: err } = await supabase
        .from('pm_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return invoice
    } catch (err) {
      console.error('updateInvoice error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteInvoice = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_invoices')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteInvoice error:', err)
      setError(err)
      throw err
    }
  }, [])

  const createInvoiceItem = useCallback(async (data) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_invoice_items')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('createInvoiceItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateInvoiceItem = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: item, error: err } = await supabase
        .from('pm_invoice_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return item
    } catch (err) {
      console.error('updateInvoiceItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteInvoiceItem = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_invoice_items')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteInvoiceItem error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    fetchInvoice,
    generateInvoiceNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
  }
}
