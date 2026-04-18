import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-void p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-amber mb-2">404</p>
        <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-sm text-white/40 mb-6">The page you are looking for does not exist.</p>
        <Link to="/">
          <Button>
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
