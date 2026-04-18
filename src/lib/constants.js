export const PROJECT_STATUSES = {
  planning: { label: 'Planning', color: 'info' },
  active: { label: 'Active', color: 'success' },
  on_hold: { label: 'On Hold', color: 'warning' },
  completed: { label: 'Completed', color: 'amber' },
  cancelled: { label: 'Cancelled', color: 'danger' },
}

export const TASK_STATUSES = {
  pending: { label: 'Pending', color: 'neutral' },
  in_progress: { label: 'In Progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  blocked: { label: 'Blocked', color: 'danger' },
  skipped: { label: 'Skipped', color: 'warning' },
}

export const TASK_PRIORITIES = {
  low: { label: 'Low', color: 'neutral' },
  normal: { label: 'Normal', color: 'info' },
  high: { label: 'High', color: 'warning' },
  urgent: { label: 'Urgent', color: 'danger' },
}

export const BUDGET_STATUSES = {
  pending: { label: 'Pending', color: 'neutral' },
  approved: { label: 'Approved', color: 'info' },
  invoiced: { label: 'Invoiced', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
}

export const CHANGE_ORDER_STATUSES = {
  draft: { label: 'Draft', color: 'neutral' },
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
  completed: { label: 'Completed', color: 'info' },
}

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Sunny', icon: 'Sun' },
  { value: 'cloudy', label: 'Cloudy', icon: 'Cloud' },
  { value: 'rain', label: 'Rain', icon: 'CloudRain' },
  { value: 'storm', label: 'Storm', icon: 'CloudLightning' },
  { value: 'hot', label: 'Hot', icon: 'Thermometer' },
  { value: 'cold', label: 'Cold', icon: 'Snowflake' },
]

export const DOCUMENT_CATEGORIES = [
  { value: 'plans', label: 'Plans' },
  { value: 'permits', label: 'Permits' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'reports', label: 'Reports' },
  { value: 'other', label: 'Other' },
]

export const CONTACT_ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'staff', label: 'Staff' },
  { value: 'consultant', label: 'Consultant' },
]

export const DEFAULT_PHASES = [
  'Site Prep',
  'Slab',
  'Frame',
  'Lock-up',
  'Fit-off',
  'Finishing',
  'Handover',
]

export const PO_STATUSES = {
  draft: { label: 'Draft', color: 'neutral' },
  sent: { label: 'Sent', color: 'info' },
  acknowledged: { label: 'Acknowledged', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' },
}

export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'neutral' },
  sent: { label: 'Sent', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  overdue: { label: 'Overdue', color: 'danger' },
  cancelled: { label: 'Cancelled', color: 'neutral' },
}

export const INVOICE_TYPES = {
  progress: { label: 'Progress', color: 'info' },
  final: { label: 'Final', color: 'success' },
  variation: { label: 'Variation', color: 'warning' },
  retention: { label: 'Retention', color: 'amber' },
}

export const SELECTION_STATUSES = {
  pending: { label: 'Pending', color: 'neutral' },
  selected: { label: 'Selected', color: 'amber' },
  ordered: { label: 'Ordered', color: 'info' },
  installed: { label: 'Installed', color: 'success' },
}

export const SELECTION_CATEGORIES = [
  'Kitchen',
  'Bathroom',
  'Flooring',
  'Paint',
  'Doors & Windows',
  'Electrical',
  'External',
  'Heating & Cooling',
  'Other',
]

export const LEAD_STATUSES = {
  new: { label: 'New', color: 'info' },
  contacted: { label: 'Contacted', color: 'amber' },
  qualified: { label: 'Qualified', color: 'warning' },
  proposal: { label: 'Proposal', color: 'info' },
  negotiation: { label: 'Negotiation', color: 'amber' },
  won: { label: 'Won', color: 'success' },
  lost: { label: 'Lost', color: 'danger' },
}

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
]

export const LEAD_PIPELINE = ['new', 'contacted', 'qualified', 'proposal', 'negotiation']

export const WARRANTY_STATUSES = {
  submitted: { label: 'Submitted', color: 'info' },
  in_progress: { label: 'In Progress', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
}

export const WARRANTY_PRIORITIES = {
  low: { label: 'Low', color: 'neutral' },
  normal: { label: 'Normal', color: 'info' },
  high: { label: 'High', color: 'warning' },
  urgent: { label: 'Urgent', color: 'danger' },
}

export const TODO_PRIORITIES = {
  low: { label: 'Low', color: 'neutral' },
  normal: { label: 'Normal', color: 'info' },
  high: { label: 'High', color: 'warning' },
  urgent: { label: 'Urgent', color: 'danger' },
}
