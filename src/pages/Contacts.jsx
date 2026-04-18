import { useState, useEffect } from 'react'
import { Users, Plus, Search, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useContacts } from '../hooks/useContacts'
import { CONTACT_ROLES } from '../lib/constants'
import { cn } from '../lib/utils'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'

const defaultForm = {
  name: '',
  company: '',
  role: 'subcontractor',
  trade: '',
  email: '',
  phone: '',
  abn: '',
  notes: '',
}

const roleBadgeColor = {
  client: 'amber',
  subcontractor: 'info',
  supplier: 'success',
  staff: 'warning',
  consultant: 'neutral',
}

export default function Contacts() {
  const { contacts, loading, fetchContacts, createContact } = useContacts()
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchContacts(roleFilter)
  }, [roleFilter, fetchContacts])

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createContact(form)
      toast.success('Contact added')
      setShowForm(false)
      setForm(defaultForm)
      fetchContacts(roleFilter)
    } catch (err) {
      toast.error(err.message || 'Failed to add contact')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = contacts.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.trade?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All Roles</option>
          {CONTACT_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <Button size="sm" onClick={() => setShowForm(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No contacts match your search' : 'No contacts yet'}
          description="Add your first contact to build your directory."
          action={!search ? { label: 'Add Contact', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[11px] font-semibold text-white/35 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-2">Trade</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Email</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((contact, idx) => (
              <div
                key={contact.id}
                className={cn(
                  'grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                  idx % 2 === 1 && 'bg-white/[0.01]'
                )}
              >
                <div className="lg:col-span-3">
                  <p className="text-sm font-medium text-white">{contact.name}</p>
                  <p className="text-xs text-white/25 lg:hidden">{contact.company}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm text-white/45 truncate">{contact.company || '-'}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-1 items-center">
                  <Badge variant={roleBadgeColor[contact.role] || 'neutral'}>
                    {CONTACT_ROLES.find(r => r.value === contact.role)?.label || contact.role}
                  </Badge>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center">
                  <p className="text-sm text-white/45 truncate">{contact.trade || '-'}</p>
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center gap-1.5">
                  {contact.phone && (
                    <>
                      <Phone className="h-3 w-3 text-white/25" />
                      <a href={`tel:${contact.phone}`} className="text-sm text-white/45 hover:text-amber truncate transition-colors">{contact.phone}</a>
                    </>
                  )}
                </div>
                <div className="hidden lg:flex lg:col-span-2 items-center gap-1.5">
                  {contact.email && (
                    <>
                      <Mail className="h-3 w-3 text-white/25" />
                      <a href={`mailto:${contact.email}`} className="text-sm text-white/45 hover:text-amber truncate transition-colors">{contact.email}</a>
                    </>
                  )}
                </div>
                <div className="flex gap-3 lg:hidden mt-1">
                  <Badge variant={roleBadgeColor[contact.role] || 'neutral'}>
                    {CONTACT_ROLES.find(r => r.value === contact.role)?.label || contact.role}
                  </Badge>
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-xs text-amber">{contact.phone}</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Contact">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              required
              className="w-full"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Company</label>
            <input
              type="text"
              value={form.company}
              onChange={e => updateForm('company', e.target.value)}
              className="w-full"
              placeholder="Smith Electrical"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Role *</label>
              <select
                value={form.role}
                onChange={e => updateForm('role', e.target.value)}
                required
                className="w-full"
              >
                {CONTACT_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Trade</label>
              <input
                type="text"
                value={form.trade}
                onChange={e => updateForm('trade', e.target.value)}
                className="w-full"
                placeholder="Electrician"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className="w-full"
                placeholder="john@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => updateForm('phone', e.target.value)}
                className="w-full"
                placeholder="0400 000 000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">ABN</label>
            <input
              type="text"
              value={form.abn}
              onChange={e => updateForm('abn', e.target.value)}
              className="w-full"
              placeholder="12 345 678 901"
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => updateForm('notes', e.target.value)}
              rows={2}
              className="w-full resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
