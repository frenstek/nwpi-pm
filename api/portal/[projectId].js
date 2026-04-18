import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { projectId } = req.query

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' })
  }

  // POST: Create a client message
  if (req.method === 'POST') {
    try {
      const { content, sender_name } = req.body

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' })
      }

      const { data: message, error } = await supabase
        .from('pm_messages')
        .insert([{
          project_id: projectId,
          content: content.trim(),
          sender_name: sender_name || 'Client',
          is_internal: false,
        }])
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ message })
    } catch (err) {
      console.error('Portal POST error:', err)
      return res.status(500).json({ error: 'Failed to send message' })
    }
  }

  // GET: Fetch all portal data
  if (req.method === 'GET') {
    try {
      // Fetch project
      const { data: project, error: projectErr } = await supabase
        .from('pm_projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectErr || !project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      // Fetch all related data in parallel
      const [
        tasksResult,
        phasesResult,
        photosResult,
        selectionsResult,
        messagesResult,
        dailyLogsResult,
        changeOrdersResult,
      ] = await Promise.all([
        // Tasks with phase info
        supabase
          .from('pm_tasks')
          .select('*, phase:pm_phases(id, name)')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),

        // Phases
        supabase
          .from('pm_phases')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),

        // Photos
        supabase
          .from('pm_photos')
          .select('*')
          .eq('project_id', projectId)
          .order('taken_at', { ascending: false }),

        // Selections
        supabase
          .from('pm_selections')
          .select('*')
          .eq('project_id', projectId)
          .order('category', { ascending: true })
          .order('created_at', { ascending: true }),

        // Messages (non-internal only)
        supabase
          .from('pm_messages')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_internal', false)
          .order('created_at', { ascending: true }),

        // Daily logs (last 5)
        supabase
          .from('pm_daily_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('log_date', { ascending: false })
          .limit(5),

        // Change orders (approved only)
        supabase
          .from('pm_change_orders')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
      ])

      // Compute task stats
      const tasks = tasksResult.data || []
      const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      }

      return res.status(200).json({
        project,
        tasks,
        phases: phasesResult.data || [],
        photos: photosResult.data || [],
        selections: selectionsResult.data || [],
        messages: messagesResult.data || [],
        dailyLogs: dailyLogsResult.data || [],
        changeOrders: changeOrdersResult.data || [],
        taskStats,
      })
    } catch (err) {
      console.error('Portal GET error:', err)
      return res.status(500).json({ error: 'Failed to load project data' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
