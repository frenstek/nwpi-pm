import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useContacts() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchContacts = useCallback(async (role) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('pm_contacts')
        .select('*')
        .order('name', { ascending: true })

      if (role && role !== 'all') {
        query = query.eq('role', role)
      }

      const { data: contacts, error: err } = await query
      if (err) throw err
      setData(contacts || [])
    } catch (err) {
      console.error('fetchContacts error:', err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createContact = useCallback(async (contactData) => {
    setError(null)
    try {
      const { data: contact, error: err } = await supabase
        .from('pm_contacts')
        .insert([contactData])
        .select()
        .single()

      if (err) throw err
      return contact
    } catch (err) {
      console.error('createContact error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateContact = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: contact, error: err } = await supabase
        .from('pm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return contact
    } catch (err) {
      console.error('updateContact error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteContact = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_contacts')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteContact error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    contacts: data,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  }
}
