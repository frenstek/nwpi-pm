import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTodos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodos = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('pm_todos')
        .select('*, project:pm_projects(id, name)')
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: err } = await query
      if (err) throw err
      setTodos(data || [])
      return data || []
    } catch (err) {
      console.error('fetchTodos error:', err)
      setError(err)
      setTodos([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createTodo = useCallback(async (data) => {
    setError(null)
    try {
      const { data: todo, error: err } = await supabase
        .from('pm_todos')
        .insert([data])
        .select('*, project:pm_projects(id, name)')
        .single()

      if (err) throw err
      return todo
    } catch (err) {
      console.error('createTodo error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateTodo = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: todo, error: err } = await supabase
        .from('pm_todos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, project:pm_projects(id, name)')
        .single()

      if (err) throw err
      return todo
    } catch (err) {
      console.error('updateTodo error:', err)
      setError(err)
      throw err
    }
  }, [])

  const toggleComplete = useCallback(async (id, currentState) => {
    setError(null)
    try {
      const { data: todo, error: err } = await supabase
        .from('pm_todos')
        .update({
          is_completed: !currentState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, project:pm_projects(id, name)')
        .single()

      if (err) throw err
      return todo
    } catch (err) {
      console.error('toggleComplete error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteTodo = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_todos')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteTodo error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
  }
}
