import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, HardHat, Search, X, Trash2, Pencil, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjects } from '../hooks/useProjects'
import { PROJECT_STATUSES } from '../lib/constants'
import { formatCurrency, cn } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'planning', label: 'Planning' },
  { id: 'active', label: 'Active' },
  { id: 'on_hold', label: 'On Hold' },
  { id: 'completed', label: 'Completed' },
]

const defaultForm = {
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
}

const statusBorderColor = {
  planning: 'border-l-info',
  active: 'border-l-success',
  on_hold: 'border-l-warning',
  completed: 'border-l-amber',
}

export default function Projects() {
  const navigate = useNavigate()
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject } = useProjects()
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProjects(activeTab)
  }, [activeTab, fetchProjects])

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editProject) {
        const payload = {
          ...form,
          contract_value: form.contract_value ? Number(form.contract_value) : null,
        }
        await updateProject(editProject.id, payload)
        toast.success('Project updated')
      } else {
        const payload = {
          ...form,
          contract_value: form.contract_value ? Number(form.contract_value) : null,
          status: 'planning',
        }
        await createProject(payload)
        toast.success('Project created')
      }
      setShowForm(false)
      setEditProject(null)
      setForm(defaultForm)
      fetchProjects(activeTab)
    } catch (err) {
      toast.error(err.message || (editProject ? 'Failed to update project' : 'Failed to create project'))
    } finally {
      setSubmitting(false)
    }
  }

  function openEditModal(project, e) {
    e.stopPropagation()
    setEditProject(project)
    setForm({
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
    })
    setShowForm(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProject(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      fetchProjects(activeTab)
    } catch (err) {
      toast.error(err.message || 'Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className="hero-banner rounded-xl"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&h=400&fit=crop)',
          minHeight: '100px',
        }}
      >
        <div className="flex flex-col justify-center px-6 py-6">
          <p className="text-amber text-xs font-semibold uppercase tracking-[0.15em] mb-1.5">
            — Projects
          </p>
          <h1 className="text-lg font-display text-white">Manage all your construction projects</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pill tabs */}
        <div className="flex gap-1 bg-void-lighter/50 rounded-xl p-1 overflow-x-auto">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer',
                activeTab === tab.id
                  ? 'bg-amber/15 text-amber shadow-sm'
                  : 'text-white/40 hover:text-white/65 hover:bg-white/[0.04]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-56 rounded-lg border border-border bg-surface py-2 text-sm text-white placeholder-white/25 focus:border-amber/50 focus:ring-1 focus:ring-amber/25 outline-none transition-colors pr-8" style={{paddingLeft:'2.5rem'}}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No projects found"
          description={activeTab === 'all' ? 'Create your first construction project to get started.' : `No ${activeTab.replace('_', ' ')} projects.`}
          action={{ label: 'New Project', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.filter(p => {
            if (!search.trim()) return true
            const q = search.toLowerCase().trim()
            return (p.name || '').toLowerCase().includes(q) ||
              (p.address || '').toLowerCase().includes(q) ||
              (p.suburb || '').toLowerCase().includes(q) ||
              (p.client_name || '').toLowerCase().includes(q) ||
              (p.postcode || '').includes(q)
          }).map(project => {
            const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.planning
            const borderColor = statusBorderColor[project.status] || 'border-l-border'
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={cn(
                  'bg-void-light border border-white/[0.06] rounded-xl text-left cursor-pointer overflow-hidden group relative',
                  'hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
                  'transition-all duration-200',
                  'border-l-[3px]',
                  borderColor
                )}
              >
                {/* Project thumbnail strip */}
                <div
                  className="h-20 w-full bg-cover bg-center relative"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=200&fit=crop)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-void-light via-void-light/60 to-transparent" />
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                    <button
                      onClick={(e) => openEditModal(project, e)}
                      className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/60 hover:text-amber hover:bg-black/80 transition-all cursor-pointer"
                      title="Edit project"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(project)
                      }}
                      className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/60 hover:text-red-400 hover:bg-black/80 transition-all cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-5 -mt-3 relative">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white truncate mr-2">{project.name}</h3>
                  <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                </div>
                {project.address && (
                  <p className="text-xs text-white/35 mb-1 truncate">{project.address}{project.suburb ? `, ${project.suburb}` : ''}</p>
                )}
                {project.client_name && (
                  <p className="text-xs text-white/25 mb-3 truncate">{project.client_name}</p>
                )}
                {project.contract_value > 0 && (
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(project.contract_value)}</p>
                )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditProject(null); setForm(defaultForm) }} title={editProject ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              required
              className="w-full"
              placeholder="e.g. Smith Residence"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                className="w-full"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Suburb</label>
              <input
                type="text"
                value={form.suburb}
                onChange={e => updateForm('suburb', e.target.value)}
                className="w-full"
                placeholder="Parramatta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">State</label>
              <select
                value={form.state}
                onChange={e => updateForm('state', e.target.value)}
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
                value={form.postcode}
                onChange={e => updateForm('postcode', e.target.value)}
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
                  value={form.client_name}
                  onChange={e => updateForm('client_name', e.target.value)}
                  className="w-full"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Client Email</label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={e => updateForm('client_email', e.target.value)}
                  className="w-full"
                  placeholder="john@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Client Phone</label>
                <input
                  type="tel"
                  value={form.client_phone}
                  onChange={e => updateForm('client_phone', e.target.value)}
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
                  value={form.project_type}
                  onChange={e => updateForm('project_type', e.target.value)}
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
                  value={form.contract_value}
                  onChange={e => updateForm('contract_value', e.target.value)}
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
                value={form.start_date}
                onChange={e => updateForm('start_date', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Target End Date</label>
              <input
                type="date"
                value={form.target_end_date}
                onChange={e => updateForm('target_end_date', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
              rows={3}
              className="w-full resize-none"
              placeholder="Project notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setShowForm(false); setEditProject(null); setForm(defaultForm) }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white/70">
                Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>?
              </p>
              <p className="text-xs text-white/40 mt-1">
                This will permanently remove the project and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
