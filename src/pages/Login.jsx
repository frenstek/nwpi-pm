import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&fit=crop)' }}
      />
      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/75 to-black/85" />
      {/* Subtle amber radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,133,12,0.08)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-sm animate-fade-in-up z-10">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpeg"
            alt="NPI Logo"
            className="h-16 w-16 rounded-xl object-cover mb-5 shadow-lg shadow-amber/20"
          />
          <h1 className="text-2xl font-display text-white mb-1">Nationwide</h1>
          <p className="text-sm font-display italic text-amber/80 mb-1">Projects & Investments</p>
          <p className="text-xs text-white/20">Construction Project Management</p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-7 space-y-5 shadow-2xl shadow-black/40"
        >
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-8">
          Powered by Nationwide Projects Investments
        </p>
      </div>
    </div>
  )
}
