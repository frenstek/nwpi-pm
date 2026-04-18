import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, CalendarDays, DollarSign, CheckCircle,
  Clock, FileText, Camera, ClipboardList, Palette, BarChart3, FileEdit, MessageSquare,
  Share2, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useActivity } from '../hooks/useActivity'
import { PROJECT_STATUSES } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import Skeleton from '../components/ui/Skeleton'
import ActivityFeed from '../components/ui/ActivityFeed'
import BudgetTab from '../components/budget/BudgetTab'
import ScheduleTab from '../components/schedule/ScheduleTab'
import DailyLogsTab from '../components/daily-logs/DailyLogsTab'
import DocumentsTab from '../components/documents/DocumentsTab'
import PhotosTab from '../components/photos/PhotosTab'
import ChangeOrdersTab from '../components/change-orders/ChangeOrdersTab'
import MessagesTab from '../components/messages/MessagesTab'
import SelectionsTab from '../components/selections/SelectionsTab'
import PurchaseOrdersTab from '../components/purchase-orders/PurchaseOrdersTab'
import InvoicesTab from '../components/invoices/InvoicesTab'
import TodosTab from '../components/todos/TodosTab'
import WarrantiesTab from '../components/warranties/WarrantiesTab'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'todos', label: 'To-Dos' },
  { id: 'budget', label: 'Budget' },
  { id: 'purchase-orders', label: 'Purchase Orders' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'documents', label: 'Documents' },
  { id: 'photos', label: 'Photos' },
  { id: 'daily-logs', label: 'Daily Logs' },
  { id: 'change-orders', label: 'Change Orders' },
  { id: 'messages', label: 'Messages' },
  { id: 'selections', label: 'Selections' },
  { id: 'warranties', label: 'Warranties' },
]

function OverviewTab({ project, taskStats, activities }) {
  const daysRemaining = project.target_end_date
    ? Math.max(0, Math.ceil((new Date(project.target_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Tasks Completed"
          value={`${taskStats.completed}/${taskStats.total}`}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          label="Contract Value"
          value={formatCurrency(project.contract_value)}
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          label="Days Remaining"
          value={daysRemaining != null ? daysRemaining : '-'}
          icon={Clock}
          color={daysRemaining != null && daysRemaining < 14 ? 'warning' : 'info'}
        />
      </div>

      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Project Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-5">
          <InfoRow label="Client" value={project.client_name} />
          <InfoRow label="Client Email" value={project.client_email} />
          <InfoRow label="Client Phone" value={project.client_phone} />
          <InfoRow label="Project Type" value={project.project_type} />
          <InfoRow
            label="Address"
            value={[project.address, project.suburb, project.state, project.postcode].filter(Boolean).join(', ')}
          />
          <InfoRow label="Contract Value" value={formatCurrency(project.contract_value)} />
          <InfoRow label="Start Date" value={formatDate(project.start_date)} />
          <InfoRow label="Target End Date" value={formatDate(project.target_end_date)} />
        </div>
        {project.description && (
          <div className="px-5 pb-5">
            <p className="text-xs font-medium text-white/40 mb-1">Description</p>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
      </div>

      <div className="bg-void-light border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <ActivityFeed activities={activities} emptyText="No activity recorded yet" />
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/40 mb-0.5">{label}</p>
      <p className="text-sm text-white/70">{value || '-'}</p>
    </div>
  )
}

function PlaceholderTab({ name }) {
  const iconMap = {
    Schedule: CalendarDays,
    Budget: DollarSign,
    Documents: FileText,
    Photos: Camera,
    'Daily Logs': ClipboardList,
    'Change Orders': FileEdit,
    Selections: Palette,
  }
  const Icon = iconMap[name] || BarChart3

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-surface mb-4">
        <Icon className="h-8 w-8 text-white/20" />
      </div>
      <h3 className="text-lg font-medium text-white/50 mb-1">{name}</h3>
      <p className="text-sm text-white/30">Coming soon</p>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fetchProject, loading: projectLoading } = useProjects()
  const { fetchTaskStats } = useTasks()
  const { fetchActivity, activities } = useActivity()
  const [project, setProject] = useState(null)
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  const activeTab = searchParams.get('tab') || 'overview'

  function setActiveTab(tab) {
    setSearchParams({ tab })
  }

  useEffect(() => {
    async function loadProject() {
      setLoading(true)
      const p = await fetchProject(id)
      setProject(p)
      const stats = await fetchTaskStats(id)
      setTaskStats(stats)
      fetchActivity(id, 10)
      setLoading(false)
    }
    loadProject()
  }, [id, fetchProject, fetchTaskStats, fetchActivity])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium text-white/50 mb-4">Project not found</p>
        <Button variant="secondary" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.planning

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-surface transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-white truncate">{project.name}</h1>
            <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
          </div>
          {project.address && (
            <p className="text-sm text-white/40 truncate">
              {[project.address, project.suburb, project.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const portalUrl = `${window.location.origin}/portal/${id}`
            navigator.clipboard.writeText(portalUrl).then(() => {
              toast.success('Portal link copied!')
            }).catch(() => {
              // Fallback: show the URL
              toast.success(portalUrl, { duration: 5000 })
            })
          }}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share Portal
        </Button>
        <Button variant="secondary" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab project={project} taskStats={taskStats} activities={activities} />}
        {activeTab === 'schedule' && <ScheduleTab projectId={project.id} project={project} />}
        {activeTab === 'budget' && <BudgetTab projectId={project.id} />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersTab projectId={project.id} />}
        {activeTab === 'invoices' && <InvoicesTab projectId={project.id} project={project} />}
        {activeTab === 'documents' && <DocumentsTab projectId={project.id} />}
        {activeTab === 'photos' && <PhotosTab projectId={project.id} />}
        {activeTab === 'daily-logs' && <DailyLogsTab projectId={project.id} />}
        {activeTab === 'change-orders' && <ChangeOrdersTab projectId={project.id} />}
        {activeTab === 'messages' && <MessagesTab projectId={project.id} />}
        {activeTab === 'selections' && <SelectionsTab projectId={project.id} />}
        {activeTab === 'todos' && <TodosTab projectId={project.id} />}
        {activeTab === 'warranties' && <WarrantiesTab projectId={project.id} />}
      </div>
    </div>
  )
}
