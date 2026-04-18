import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async (status) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('pm_leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error: err } = await query
      if (err) throw err
      setLeads(data || [])
      return data || []
    } catch (err) {
      console.error('fetchLeads error:', err)
      setError(err)
      setLeads([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createLead = useCallback(async (data) => {
    setError(null)
    try {
      const { data: lead, error: err } = await supabase
        .from('pm_leads')
        .insert([data])
        .select()
        .single()

      if (err) throw err
      return lead
    } catch (err) {
      console.error('createLead error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateLead = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: lead, error: err } = await supabase
        .from('pm_leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return lead
    } catch (err) {
      console.error('updateLead error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteLead = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_leads')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteLead error:', err)
      setError(err)
      throw err
    }
  }, [])

  const convertToProject = useCallback(async (leadId) => {
    setError(null)
    try {
      // Fetch the lead first
      const { data: lead, error: fetchErr } = await supabase
        .from('pm_leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (fetchErr) throw fetchErr

      // Create a project from lead data
      const { data: project, error: projectErr } = await supabase
        .from('pm_projects')
        .insert([{
          name: lead.name,
          address: lead.address || null,
          suburb: lead.suburb || null,
          client_name: lead.name,
          client_email: lead.email || null,
          client_phone: lead.phone || null,
          project_type: lead.project_type || 'residential',
          status: 'planning',
          contract_value: lead.estimated_value || 0,
          description: lead.notes || null,
        }])
        .select()
        .single()

      if (projectErr) throw projectErr

      // Update lead status to won and link to project
      const { error: updateErr } = await supabase
        .from('pm_leads')
        .update({
          status: 'won',
          converted_project_id: project.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateErr) throw updateErr

      return project
    } catch (err) {
      console.error('convertToProject error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertToProject,
  }
}
