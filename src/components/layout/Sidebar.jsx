import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, UserPlus, Users, BarChart3,
  LogOut, X, PanelLeftClose, PanelLeft, Calculator, Settings, ListChecks,
  ClipboardCheck, BookOpen, FileText, CloudUpload, Receipt,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/tracker', icon: ClipboardCheck, label: 'Tracker' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { to: '/leads', icon: UserPlus, label: 'Leads' },
      { to: '/contacts', icon: Users, label: 'Contacts' },
      { to: '/resources', icon: BookOpen, label: 'Resources' },
      { to: '/expense-hub', icon: Receipt, label: 'Expense Hub' },
    ],
  },
  {
    label: 'ESTIMATOR',
    items: [
      { to: '/estimator', icon: Calculator, label: 'Estimator' },
      { to: '/estimator/admin', icon: Settings, label: 'Config' },
      { to: '/inclusions', icon: ListChecks, label: 'Inclusions' },
      { to: '/quotes', icon: FileText, label: 'Quotes' },
    ],
  },
  {
    label: 'CLIENT',
    items: [
      { to: '/client-uploads', icon: CloudUpload, label: 'Client Uploads' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-dvh bg-void-light border-r border-border',
          'flex flex-col transition-all duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0">
          <img
            src="/logo.jpeg"
            alt="NPI Logo"
            className="h-10 w-10 rounded-lg object-cover shrink-0 shadow-sm shadow-amber/20"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">Nationwide</p>
              <p className="text-[11px] text-white/35 truncate">Project Manager</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amber accent line */}
        <div className="mx-4 h-[2px] bg-gradient-to-r from-amber/50 via-amber/20 to-transparent rounded-full" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em]">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                        isActive
                          ? 'bg-gradient-to-r from-amber/10 to-amber/[0.03] text-amber shadow-sm shadow-amber/5'
                          : 'text-white/45 hover:text-white/70 hover:bg-white/[0.04]'
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <div className="hidden lg:flex px-3 pb-2">
          <button
            onClick={() => setCollapsed(prev => !prev)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all cursor-pointer w-full',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Separator */}
        <div className="mx-3 h-px bg-border" />

        {/* User Section */}
        <div className={cn('px-3 py-4 shrink-0', collapsed && 'flex flex-col items-center')}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-amber/10 text-amber text-xs font-bold hover:bg-amber/20 transition-all cursor-pointer"
              title="Sign out"
            >
              {initials}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-full bg-amber/10 text-amber text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
