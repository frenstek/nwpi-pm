import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data: tasks, error: err } = await supabase
        .from('pm_tasks')
        .select('*, phase:pm_phases(id, name), assignee:pm_contacts!assigned_to(id, name)')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (err) throw err
      setData(tasks || [])
      return tasks || []
    } catch (err) {
      console.error('fetchTasks error:', err)
      setError(err)
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTaskStats = useCallback(async (projectId) => {
    try {
      let query = supabase.from('pm_tasks').select('status')
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: tasks, error: err } = await query
      if (err) throw err

      const total = tasks?.length || 0
      const completed = tasks?.filter(t => t.status === 'completed').length || 0
      const pending = tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0

      return { total, completed, pending }
    } catch (err) {
      console.error('fetchTaskStats error:', err)
      return { total: 0, completed: 0, pending: 0 }
    }
  }, [])

  const createTask = useCallback(async (taskData) => {
    setError(null)
    try {
      const { data: task, error: err } = await supabase
        .from('pm_tasks')
        .insert([taskData])
        .select()
        .single()

      if (err) throw err
      return task
    } catch (err) {
      console.error('createTask error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateTask = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: task, error: err } = await supabase
        .from('pm_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return task
    } catch (err) {
      console.error('updateTask error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_tasks')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteTask error:', err)
      setError(err)
      throw err
    }
  }, [])

  // Phase operations
  const fetchPhases = useCallback(async (projectId) => {
    try {
      const { data: phases, error: err } = await supabase
        .from('pm_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (err) throw err
      return phases || []
    } catch (err) {
      console.error('fetchPhases error:', err)
      return []
    }
  }, [])

  const createPhase = useCallback(async (phaseData) => {
    setError(null)
    try {
      const { data: phase, error: err } = await supabase
        .from('pm_phases')
        .insert([phaseData])
        .select()
        .single()

      if (err) throw err
      return phase
    } catch (err) {
      console.error('createPhase error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updatePhase = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: phase, error: err } = await supabase
        .from('pm_phases')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return phase
    } catch (err) {
      console.error('updatePhase error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deletePhase = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_phases')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deletePhase error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    tasks: data,
    loading,
    error,
    fetchTasks,
    fetchTaskStats,
    createTask,
    updateTask,
    deleteTask,
    fetchPhases,
    createPhase,
    updatePhase,
    deletePhase,
  }
}
