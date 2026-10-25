import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, CalendarDays, DollarSign, CheckCircle,
  Clock, FileText, Camera, ClipboardList, Palette, BarChart3, FileEdit, MessageSquare,
  Share2, Check, Trash2, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useActivity } from '../hooks/useActivity'
import { PROJECT_STATUSES } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
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
import PreConstructionTab from '../components/pre-construction/PreConstructionTab'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'pre-construction', label: 'Pre-Construction' },
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

const editDefaultForm = {
  name: '',
  address: '',
  suburb: '',
  state: 'NSW',
  postcode: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  project_type: 'residential',
  contract_value: '',
  start_date: '',
  target_end_date: '',
  description: '',
  status: 'planning',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fetchProject, updateProject, deleteProject, loading: projectLoading } = useProjects()
  const { fetchTaskStats } = useTasks()
  const { fetchActivity, activities } = useActivity()
  const [project, setProject] = useState(null)
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState(editDefaultForm)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const activeTab = searchParams.get('tab') || 'overview'

  function setActiveTab(tab) {
    setSearchParams({ tab })
  }

  function openEditModal() {
    if (!project) return
    setEditForm({
      name: project.name || '',
      address: project.address || '',
      suburb: project.suburb || '',
      state: project.state || 'NSW',
      postcode: project.postcode || '',
      client_name: project.client_name || '',
      client_email: project.client_email || '',
      client_phone: project.client_phone || '',
      project_type: project.project_type || 'residential',
      contract_value: project.contract_value || '',
      start_date: project.start_date || '',
      target_end_date: project.target_end_date || '',
      description: project.description || '',
      status: project.status || 'planning',
    })
    setShowEditModal(true)
  }

  function updateEditForm(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setEditSubmitting(true)
    try {
      const payload = {
        ...editForm,
        contract_value: editForm.contract_value ? Number(editForm.contract_value) : null,
      }
      const updated = await updateProject(id, payload)
      setProject(updated)
      toast.success('Project updated')
      setShowEditModal(false)
    } catch (err) {
      toast.error(err.message || 'Failed to update project')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleteSubmitting(true)
    try {
      await deleteProject(id)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.message || 'Failed to delete project')
    } finally {
      setDeleteSubmitting(false)
    }
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
      {/* Project Hero Banner */}
      <div
        className="hero-banner rounded-xl"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=300&fit=crop)',
          minHeight: '120px',
        }}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <button
            onClick={() => navigate('/projects')}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-display text-white truncate">{project.name}</h1>
              <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
            </div>
            {project.address && (
              <p className="text-sm text-white/50 truncate">
                {[project.address, project.suburb, project.state].filter(Boolean).join(', ')}
              </p>
            )}
            {project.client_name && (
              <p className="text-xs text-amber/60 mt-0.5">{project.client_name}</p>
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
                toast.success(portalUrl, { duration: 5000 })
              })
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Portal
          </Button>
          <Button variant="secondary" size="sm" onClick={openEditModal}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab project={project} taskStats={taskStats} activities={activities} />}
        {activeTab === 'pre-construction' && <PreConstructionTab projectId={project.id} project={project} />}
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

      {/* Edit Project Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Project Name *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => updateEditForm('name', e.target.value)}
              required
              className="w-full"
              placeholder="e.g. Smith Residence"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Status</label>
            <select
              value={editForm.status}
              onChange={e => updateEditForm('status', e.target.value)}
              className="w-full"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Street Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={e => updateEditForm('address', e.target.value)}
                className="w-full"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Suburb</label>
              <input
                type="text"
                value={editForm.suburb}
                onChange={e => updateEditForm('suburb', e.target.value)}
                className="w-full"
                placeholder="Parramatta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">State</label>
              <select
                value={editForm.state}
                onChange={e => updateEditForm('state', e.target.value)}
                className="w-full"
              >
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="WA">WA</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
                <option value="ACT">ACT</option>
                <option value="NT">NT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Postcode</label>
              <input
                type="text"
                value={editForm.postcode}
                onChange={e => updateEditForm('postcode', e.target.value)}
                className="w-full"
                placeholder="2150"
                maxLength={4}
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-3">Client Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Client Name</label>
                <input
                  type="text"
                  value={editForm.client_name}
                  onChange={e => updateEditForm('client_name', e.target.value)}
                  className="w-full"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Client Email</label>
                <input
                  type="email"
                  value={editForm.client_email}
                  onChange={e => updateEditForm('client_email', e.target.value)}
                  className="w-full"
                  placeholder="john@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Client Phone</label>
                <input
                  type="tel"
                  value={editForm.client_phone}
                  onChange={e => updateEditForm('client_phone', e.target.value)}
                  className="w-full"
                  placeholder="0400 000 000"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Project Type</label>
                <select
                  value={editForm.project_type}
                  onChange={e => updateEditForm('project_type', e.target.value)}
                  className="w-full"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="renovation">Renovation</option>
                  <option value="extension">Extension</option>
                  <option value="fitout">Fit-out</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Contract Value ($)</label>
                <input
                  type="number"
                  value={editForm.contract_value}
                  onChange={e => updateEditForm('contract_value', e.target.value)}
                  className="w-full"
                  placeholder="500000"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Start Date</label>
              <input
                type="date"
                value={editForm.start_date}
                onChange={e => updateEditForm('start_date', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Target End Date</label>
              <input
                type="date"
                value={editForm.target_end_date}
                onChange={e => updateEditForm('target_end_date', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Description</label>
            <textarea
              value={editForm.description}
              onChange={e => updateEditForm('description', e.target.value)}
              rows={3}
              className="w-full resize-none"
              placeholder="Project notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="danger" type="button" size="sm" onClick={() => { setShowEditModal(false); setShowDeleteConfirm(true) }}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={editSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white/70">
                Are you sure you want to delete <span className="font-semibold text-white">{project?.name}</span>?
              </p>
              <p className="text-xs text-white/40 mt-1">
                This will permanently remove the project and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteSubmitting}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
