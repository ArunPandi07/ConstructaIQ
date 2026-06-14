import { useState } from 'react'
import { motion } from 'framer-motion'
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
  const [reportEmailOptIn, setReportEmailOptIn] = useState(
    user?.report_email_opt_in ?? true,
  )

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
        report_email_opt_in: reportEmailOptIn,
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h1 className="text-2xl font-extrabold text-stone-900 mb-6 tracking-tight">
        Profile Settings
      </h1>

      <div className="glass-card p-6">
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-1.5">
              <User size={16} className="text-stone-400" />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-1.5">
              <Mail size={16} className="text-stone-400" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
            />
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
            <input
              type="checkbox"
              checked={reportEmailOptIn}
              onChange={(e) => setReportEmailOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#F5C518] rounded"
            />
            <div>
              <span className="text-sm font-semibold text-stone-700">
                Email intelligence reports
              </span>
              <p className="text-xs text-stone-500 mt-0.5">
                Receive consolidated reports via email after analysis completes.
              </p>
            </div>
          </div>

          <hr className="border-stone-200 my-6" />

          <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Lock size={16} className="text-stone-400" />
            Change Password
          </h3>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
              placeholder="Confirm new password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? '#a8a29e' : '#F5C518', color: loading ? '#fff' : '#000' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
