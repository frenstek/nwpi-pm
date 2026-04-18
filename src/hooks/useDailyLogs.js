import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDailyLogs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDailyLogs = useCallback(async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const { data: logs, error: err } = await supabase
        .from('pm_daily_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('log_date', { ascending: false })

      if (err) throw err
      setData(logs || [])
      return logs || []
    } catch (err) {
      console.error('fetchDailyLogs error:', err)
      setError(err)
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createDailyLog = useCallback(async (logData) => {
    setError(null)
    try {
      const { data: log, error: err } = await supabase
        .from('pm_daily_logs')
        .insert([logData])
        .select()
        .single()

      if (err) throw err
      return log
    } catch (err) {
      console.error('createDailyLog error:', err)
      setError(err)
      throw err
    }
  }, [])

  const updateDailyLog = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data: log, error: err } = await supabase
        .from('pm_daily_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      return log
    } catch (err) {
      console.error('updateDailyLog error:', err)
      setError(err)
      throw err
    }
  }, [])

  const deleteDailyLog = useCallback(async (id) => {
    setError(null)
    try {
      const { error: err } = await supabase
        .from('pm_daily_logs')
        .delete()
        .eq('id', id)

      if (err) throw err
    } catch (err) {
      console.error('deleteDailyLog error:', err)
      setError(err)
      throw err
    }
  }, [])

  return {
    dailyLogs: data,
    loading,
    error,
    fetchDailyLogs,
    createDailyLog,
    updateDailyLog,
    deleteDailyLog,
  }
}
