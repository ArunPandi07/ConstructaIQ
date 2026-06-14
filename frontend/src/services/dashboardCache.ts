import type { DashboardData } from '../types'

let dashboardCache: { data: DashboardData; at: number } | null = null
const DASHBOARD_TTL_MS = 60_000

export function getDashboardCache(): { data: DashboardData; at: number } | null {
  if (dashboardCache && Date.now() - dashboardCache.at < DASHBOARD_TTL_MS) {
    return dashboardCache
  }
  return null
}

export function setDashboardCache(data: DashboardData) {
  dashboardCache = { data, at: Date.now() }
}

export function clearDashboardCache() {
  dashboardCache = null
}
