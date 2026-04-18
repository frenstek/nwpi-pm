import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchActivity = useCallback(async (projectId, limit = 50) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (err) throw err
      setActivities(data || [])
      return data || []
    } catch (err) {
      // Table may not exist yet — handle gracefully
      console.error('fetchActivity error:', err)
      setError(err)
      setActivities([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRecentActivity = useCallback(async (limit = 10) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pm_activity_log')
        .select('*, project:pm_projects(id, name)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (err) throw err
      setActivities(data || [])
      return data || []
    } catch (err) {
      // Table may not exist yet — handle gracefully
      console.error('fetchRecentActivity error:', err)
      setError(err)
      setActivities([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const logActivity = useCallback(async (activityData) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const performedBy = user?.email?.split('@')[0] || 'Admin'

      const { data: activity, error: err } = await supabase
        .from('pm_activity_log')
        .insert([{
          ...activityData,
          performed_by: activityData.performed_by || performedBy,
        }])
        .select()
        .single()

      if (err) throw err
      return activity
    } catch (err) {
      // Table may not exist yet — fail silently for logging
      console.error('logActivity error:', err)
      setError(err)
      return null
    }
  }, [])

  return {
    activities,
    loading,
    error,
    fetchActivity,
    fetchRecentActivity,
    logActivity,
  }
}
