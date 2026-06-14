import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 48,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LogIn size={48} color="#667eea" style={{ margin: '0 auto' }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 16 }}>
            ConstructaIQ
          </h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 16,
              }}
              placeholder="you@company.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 16,
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              style={{
                padding: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
