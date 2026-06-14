import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../services/authApi'
import { User, Lock, Mail } from 'lucide-react'

export function Profile() {
  const { user, refreshUser } = useAuth()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await updateProfile({
        full_name: fullName,
        email,
        ...(newPassword && {
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      await refreshUser()
      setSuccess('Profile updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        Profile Settings
      </h1>

      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 32,
          border: '1px solid #e2e8f0',
        }}
      >
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <User size={18} />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
              }}
            />
          </div>

          <hr
            style={{
              margin: '32px 0',
              border: 'none',
              borderTop: '1px solid #e2e8f0',
            }}
          />

          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            <Lock size={18} style={{ display: 'inline', marginRight: 8 }} />
            Change Password
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
            >
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
              }}
              placeholder="Enter current password"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
            >
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
              }}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
              }}
              placeholder="Confirm new password"
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
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: 12,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                color: '#16a34a',
                marginBottom: 16,
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
