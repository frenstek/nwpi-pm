import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, DollarSign, ClipboardList, CheckCircle, Plus, ArrowRight,
  UserPlus, Activity, Square, CheckSquare, CalendarDays, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useActivity } from '../hooks/useActivity'
import { useTodos } from '../hooks/useTodos'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatDate } from '../lib/utils'
import { PROJECT_STATUSES, TODO_PRIORITIES } from '../lib/constants'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import ActivityFeed from '../components/ui/ActivityFeed'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, fetchProjects, loading: projectsLoading } = useProjects()
  const { fetchTaskStats } = useTasks()
  const { fetchRecentActivity, activities } = useActivity()
  const { todos, fetchTodos, createTodo, toggleComplete } = useTodos()
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [quickTodo, setQuickTodo] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await fetchProjects()
      const stats = await fetchTaskStats()
      setTaskStats(stats)
      fetchRecentActivity(10)
      fetchTodos()
      setLoading(false)
    }
    loadData()
  }, [fetchProjects, fetchTaskStats, fetchRecentActivity, fetchTodos])

  const activeProjects = projects.filter(p => p.status === 'active')
  const totalContractValue = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0)
  const completedThisMonth = projects.filter(p => {
    if (p.status !== 'completed' || !p.updated_at) return false
    const updated = new Date(p.updated_at)
    const now = new Date()
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
  }).length
  const recentProjects = projects.slice(0, 5)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const displayName = user?.email?.split('@')[0] || 'there'
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-white">
          {greeting}, <span className="capitalize">{displayName}</span>
        </h2>
        <p className="text-sm text-white/30">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          icon={FolderKanban}
          color="amber"
        />
        <StatCard
          label="Total Contract Value"
          value={formatCurrency(totalContractValue)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          label="Pending Tasks"
          value={taskStats.pending}
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label="Completed This Month"
          value={completedThisMonth}
          icon={CheckCircle}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-void-light border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-0.5 rounded-full bg-amber" />
              <h2 className="text-sm font-semibold text-white">Recent Projects</h2>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-amber/70 hover:text-amber transition-colors cursor-pointer font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentProjects.length === 0 ? (
              <p className="px-5 py-10 text-sm text-white/25 text-center">No projects yet</p>
            ) : (
              recentProjects.map(project => {
                const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.planning
                return (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                      <p className="text-xs text-white/30 truncate">{project.address || 'No address'}</p>
                    </div>
                    <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-void-light border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-4 w-0.5 rounded-full bg-amber" />
            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/projects')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber/10 text-amber shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              New Project
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-info/10 text-info shrink-0">
                <ArrowRight className="h-4 w-4" />
              </div>
              View All Projects
            </button>
            <button
              onClick={() => navigate('/contacts')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-success/10 text-success shrink-0">
                <UserPlus className="h-4 w-4" />
              </div>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* To-Dos */}
      <DashboardTodos
        todos={todos}
        projects={projects}
        quickTodo={quickTodo}
        setQuickTodo={setQuickTodo}
        onQuickAdd={async (e) => {
          e.preventDefault()
          if (!quickTodo.trim() || projects.length === 0) return
          try {
            await createTodo({ project_id: projects[0].id, title: quickTodo.trim() })
            setQuickTodo('')
            toast.success('To-do added')
            await fetchTodos()
          } catch (err) {
            toast.error(err.message || 'Failed to add to-do')
          }
        }}
        onToggle={async (todo) => {
          try {
            await toggleComplete(todo.id, todo.is_completed)
            toast.success(todo.is_completed ? 'Marked incomplete' : 'Completed!')
            await fetchTodos()
          } catch (err) {
            toast.error(err.message || 'Failed to update')
          }
        }}
        navigate={navigate}
      />

      {/* Recent Activity */}
      <div className="bg-void-light border border-white/[0.06] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-0.5 rounded-full bg-amber" />
            <Activity className="h-4 w-4 text-amber" />
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
        </div>
        <ActivityFeed
          activities={activities}
          showProject
          emptyText="No recent activity across projects"
        />
      </div>
    </div>
  )
}

function DashboardTodos({ todos, projects, quickTodo, setQuickTodo, onQuickAdd, onToggle, navigate }) {
  const incompleteTodos = (todos || []).filter(t => !t.is_completed).slice(0, 8)

  return (
    <div className="bg-void-light border border-white/[0.06] rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-0.5 rounded-full bg-amber" />
          <CheckSquare className="h-4 w-4 text-amber" />
          <h2 className="text-sm font-semibold text-white">To-Dos</h2>
          {incompleteTodos.length > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber/10 text-amber text-[10px] font-bold tabular-nums">
              {incompleteTodos.length}
            </span>
          )}
        </div>
      </div>

      {/* Quick Add */}
      {projects.length > 0 && (
        <form onSubmit={onQuickAdd} className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
          <input
            type="text"
            value={quickTodo}
            onChange={e => setQuickTodo(e.target.value)}
            placeholder="Quick add to-do..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!quickTodo.trim()}>
            <Plus className="h-3 w-3" />
          </Button>
        </form>
      )}

      <div className="divide-y divide-white/[0.04]">
        {incompleteTodos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-white/25 text-center">No pending to-dos</p>
        ) : (
          incompleteTodos.map(todo => {
            const isOverdue = todo.due_date && new Date(todo.due_date) < new Date(new Date().toDateString())
            const priorityCfg = TODO_PRIORITIES[todo.priority] || TODO_PRIORITIES.normal

            return (
              <div key={todo.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                <button
                  onClick={() => onToggle(todo)}
                  className="mt-0.5 shrink-0 cursor-pointer text-white/20 hover:text-amber transition-colors"
                >
                  <Square className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{todo.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/30">
                    {todo.project && (
                      <button
                        onClick={() => navigate(`/projects/${todo.project.id}?tab=todos`)}
                        className="text-amber/50 hover:text-amber transition-colors cursor-pointer truncate max-w-[120px]"
                      >
                        {todo.project.name}
                      </button>
                    )}
                    {todo.due_date && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger' : ''}`}>
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(todo.due_date)}
                        {isOverdue && <AlertTriangle className="h-3 w-3" />}
                      </span>
                    )}
                    {todo.priority !== 'normal' && (
                      <Badge variant={priorityCfg.color} className="text-[10px]">{priorityCfg.label}</Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
