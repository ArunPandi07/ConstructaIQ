import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { register } from '../services/authApi'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await register({ email, password, full_name: fullName })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card p-8 w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <UserPlus size={40} className="mx-auto text-[#F5C518]" />
          <h1 className="text-2xl font-extrabold text-stone-900 mt-4 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            Join ConstructaIQ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? '#a8a29e' : '#F5C518', color: loading ? '#fff' : '#000' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#E2B30D] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
