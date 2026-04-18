import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/contacts': 'Contacts',
  '/leads': 'Leads',
  '/reports': 'Reports',
}

export default function TopBar({ onMenuToggle }) {
  const location = useLocation()

  const isProjectDetail = location.pathname.startsWith('/projects/') && location.pathname !== '/projects'

  let title = pageTitles[location.pathname] || ''
  if (isProjectDetail) title = 'Project Detail'

  return (
    <div className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-6 bg-void/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-white/80">{title}</h1>
      </div>
    </div>
  )
}
