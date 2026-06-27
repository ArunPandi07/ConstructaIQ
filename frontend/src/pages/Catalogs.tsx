import { useEffect, useState } from 'react'
import { Truck, Users, Loader2 } from 'lucide-react'
import { apiClient } from '../services/apiClient'
import { unwrapData } from '../services/projectApi'

interface SupplierRow {
  supplier_id: number
  supplier_name: string
  supplier_category?: string | null
  email?: string | null
}

interface CrewRow {
  crew_id: number
  employee_name: string
  skill_type?: string | null
  daily_rate?: number | null
}

export default function Catalogs() {
  const [tab, setTab] = useState<'suppliers' | 'crew'>('suppliers')
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [crew, setCrew] = useState<CrewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiClient.get<SupplierRow[]>('/suppliers').then(unwrapData),
      apiClient.get<CrewRow[]>('/crew').then(unwrapData),
    ])
      .then(([supplierRows, crewRows]) => {
        setSuppliers(supplierRows)
        setCrew(crewRows)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Catalogs</h1>
        <p className="text-sm text-stone-500 mt-1">
          Supplier and crew master data used by procurement agents.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            tab === 'suppliers' ? 'bg-[#1a2035] text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          Suppliers
        </button>
        <button
          type="button"
          onClick={() => setTab('crew')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            tab === 'crew' ? 'bg-[#1a2035] text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Crew
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading catalogs…
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && tab === 'suppliers' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10 shadow-sm">
                <tr className="text-left text-stone-500">
                  <th className="p-3 font-bold bg-stone-50">Name</th>
                  <th className="p-3 font-bold bg-stone-50">Category</th>
                  <th className="p-3 font-bold bg-stone-50">Contact</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((row) => (
                  <tr key={row.supplier_id} className="border-b border-stone-100 hover:bg-stone-50/55 transition-colors">
                    <td className="p-3 font-semibold text-stone-800">{row.supplier_name}</td>
                    <td className="p-3 text-stone-600">{row.supplier_category ?? '—'}</td>
                    <td className="p-3 text-stone-600">{row.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {suppliers.length === 0 && (
            <p className="text-sm text-stone-500 p-6 text-center">No suppliers in catalog.</p>
          )}
        </div>
      )}

      {!loading && !error && tab === 'crew' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10 shadow-sm">
                <tr className="text-left text-stone-500">
                  <th className="p-3 font-bold bg-stone-50">Name</th>
                  <th className="p-3 font-bold bg-stone-50">Skill</th>
                  <th className="p-3 font-bold bg-stone-50">Rate</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((row) => (
                  <tr key={row.crew_id} className="border-b border-stone-100 hover:bg-stone-50/55 transition-colors">
                    <td className="p-3 font-semibold text-stone-800">{row.employee_name}</td>
                    <td className="p-3 text-stone-600">{row.skill_type ?? '—'}</td>
                    <td className="p-3 text-stone-600">
                      {row.daily_rate != null ? `$${Number(row.daily_rate).toLocaleString()}/day` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {crew.length === 0 && (
            <p className="text-sm text-stone-500 p-6 text-center">No crew entries in catalog.</p>
          )}
        </div>
      )}
    </div>
  )
}
