import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Contacts from './pages/Contacts'
import Leads from './pages/Leads'
import Reports from './pages/Reports'
import Tracker from './pages/Tracker'
import Resources from './pages/Resources'
import Estimator from './pages/Estimator'
import EstimatorAdmin from './pages/EstimatorAdmin'
import Inclusions from './pages/Inclusions'
import Quotes from './pages/Quotes'
import ClientPortal from './pages/ClientPortal'
import ClientUpload from './pages/ClientUpload'
import ClientUploadsAdmin from './pages/ClientUploadsAdmin'
import ExpenseHub from './pages/ExpenseHub'
import NotFound from './pages/NotFound'

function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-void">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber text-white font-bold animate-pulse">
          NPI
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:projectId" element={<ClientPortal />} />
      <Route path="/client-upload/:token" element={<ClientUpload />} />
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="leads" element={<Leads />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="resources" element={<Resources />} />
        <Route path="reports" element={<Reports />} />
        <Route path="estimator" element={<Estimator />} />
        <Route path="estimator/admin" element={<EstimatorAdmin />} />
        <Route path="inclusions" element={<Inclusions />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="client-uploads" element={<ClientUploadsAdmin />} />
        <Route path="expense-hub" element={<ExpenseHub />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
