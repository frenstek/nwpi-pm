import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Sun, Cloud, CloudRain, CloudLightning,
  Thermometer, Snowflake, Users, Clock, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDailyLogs } from '../../hooks/useDailyLogs'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import DailyLogForm from './DailyLogForm'

const weatherConfig = {
  sunny: { icon: Sun, label: 'Sunny', color: 'text-amber-light' },
  cloudy: { icon: Cloud, label: 'Cloudy', color: 'text-white/50' },
  rain: { icon: CloudRain, label: 'Rain', color: 'text-info' },
  storm: { icon: CloudLightning, label: 'Storm', color: 'text-warning' },
  hot: { icon: Thermometer, label: 'Hot', color: 'text-danger' },
  cold: { icon: Snowflake, label: 'Cold', color: 'text-info' },
}

function DailyLogCard({ log, onEdit, onDelete }) {
  const weather = weatherConfig[log.weather] || weatherConfig.sunny
  const WeatherIcon = weather.icon

  return (
    <div className="bg-void-light border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white">{formatDate(log.log_date)}</span>
          <div className="flex items-center gap-1.5">
            <WeatherIcon className={`h-4 w-4 ${weather.color}`} />
            <span className="text-xs text-white/50">{weather.label}</span>
            {log.temperature != null && (
              <span className="text-xs text-white/40">{log.temperature}&deg;C</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(log)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-surface transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(log)}
            className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-surface transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {(log.workers_on_site != null || log.hours_worked != null) && (
          <div className="flex items-center gap-4">
            {log.workers_on_site != null && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Users className="h-3.5 w-3.5" />
                <span>{log.workers_on_site} workers</span>
              </div>
            )}
            {log.hours_worked != null && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock className="h-3.5 w-3.5" />
                <span>{log.hours_worked} hrs</span>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-white/40 mb-1">Work Completed</p>
          <p className="text-sm text-white/70 whitespace-pre-wrap">{log.work_completed}</p>
        </div>

        {log.issues && (
          <div className="bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-danger" />
              <p className="text-xs font-medium text-danger">Issues</p>
            </div>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{log.issues}</p>
          </div>
        )}

        {log.notes && (
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Notes</p>
            <p className="text-sm text-white/50 whitespace-pre-wrap">{log.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DailyLogsTab({ projectId }) {
  const { dailyLogs, loading, fetchDailyLogs, createDailyLog, updateDailyLog, deleteDailyLog } = useDailyLogs()
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDailyLogs(projectId)
  }, [projectId, fetchDailyLogs])

  async function handleSubmit(formData) {
    setSaving(true)
    try {
      if (editingLog) {
        await updateDailyLog(editingLog.id, formData)
        toast.success('Daily log updated')
      } else {
        await createDailyLog({ ...formData, project_id: projectId })
        toast.success('Daily log created')
      }
      setShowForm(false)
      setEditingLog(null)
      fetchDailyLogs(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to save daily log')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(log) {
    setEditingLog(log)
    setShowForm(true)
  }

  async function handleDelete(log) {
    if (!confirm(`Delete log for ${formatDate(log.log_date)}?`)) return
    try {
      await deleteDailyLog(log.id)
      toast.success('Daily log deleted')
      fetchDailyLogs(projectId)
    } catch (err) {
      toast.error(err.message || 'Failed to delete daily log')
    }
  }

  function handleClose() {
    setShowForm(false)
    setEditingLog(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{dailyLogs.length} log{dailyLogs.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Daily Log
        </Button>
      </div>

      {dailyLogs.length === 0 ? (
        <EmptyState
          icon={Sun}
          title="No daily logs yet"
          description="Start logging daily site activity to keep a record of progress, weather, and issues."
          action={{ label: 'Add Daily Log', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {dailyLogs.map(log => (
            <DailyLogCard
              key={log.id}
              log={log}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingLog ? 'Edit Daily Log' : 'New Daily Log'}
        size="lg"
      >
        <DailyLogForm
          initialData={editingLog}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
