import {
  CheckCircle, Plus, DollarSign, FileText, Camera, ClipboardList,
  FileSignature, MessageSquare, Pencil, ArrowRight, Activity,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const ACTION_CONFIG = {
  task_created: { icon: Plus, color: 'text-info', label: 'Task created' },
  task_completed: { icon: CheckCircle, color: 'text-success', label: 'Task completed' },
  task_updated: { icon: Pencil, color: 'text-info', label: 'Task updated' },
  budget_item_added: { icon: DollarSign, color: 'text-amber', label: 'Budget item added' },
  budget_item_updated: { icon: DollarSign, color: 'text-amber', label: 'Budget item updated' },
  document_uploaded: { icon: FileText, color: 'text-info', label: 'Document uploaded' },
  photo_uploaded: { icon: Camera, color: 'text-purple-400', label: 'Photo uploaded' },
  log_created: { icon: ClipboardList, color: 'text-warning', label: 'Daily log created' },
  change_order_submitted: { icon: FileSignature, color: 'text-warning', label: 'Change order submitted' },
  change_order_approved: { icon: CheckCircle, color: 'text-success', label: 'Change order approved' },
  change_order_rejected: { icon: FileSignature, color: 'text-danger', label: 'Change order rejected' },
  message_sent: { icon: MessageSquare, color: 'text-info', label: 'Message sent' },
  project_created: { icon: Plus, color: 'text-success', label: 'Project created' },
  project_updated: { icon: Pencil, color: 'text-info', label: 'Project updated' },
  status_changed: { icon: ArrowRight, color: 'text-amber', label: 'Status changed' },
}

function getActionConfig(action) {
  return ACTION_CONFIG[action] || { icon: Activity, color: 'text-white/40', label: action }
}

function formatTimestamp(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function ActivityFeed({ activities, showProject = false, emptyText = 'No recent activity' }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Activity className="h-8 w-8 text-white/10 mb-2" />
        <p className="text-sm text-white/30">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/50">
      {activities.map(item => {
        const config = getActionConfig(item.action)
        const Icon = config.icon

        return (
          <div key={item.id} className="flex items-start gap-3 px-5 py-3">
            <div className={`mt-0.5 shrink-0 ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/70">
                {item.details || config.label}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {showProject && item.project?.name && (
                  <span className="text-[10px] text-amber truncate max-w-[200px]">
                    {item.project.name}
                  </span>
                )}
                <span className="text-[10px] text-white/20">
                  {item.performed_by} &middot; {formatTimestamp(item.created_at)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
