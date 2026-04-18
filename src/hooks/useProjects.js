import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async (status) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('pm_projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: projects, error: err } = await query
      if (err) throw err
      setData(projects || [])
    } catch (err) {
      console.error('fetchProjects error:', err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProject = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const { data: project, error: err } = await supabase
        .from('pm_projects')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      return project
    } catch (err) {
      console.error('fetchProject error:', err)
      setError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(async (projectData) => {
    setError(null)
    try {
      const { data: project, error: err } = await supabase
        .from('pm_projects')
        .insert([projectData])
        .select()
        .single()

      if (err) throw err
      return project
    } catch (err) {
      console.error('createProject error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateProject = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: project, error: err } = await supabase
        .from('pm_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return project
    } catch (err) {
      console.error('updateProject error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteProject = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_projects')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteProject error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    projects: data,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  }
}
