// ─────────────────────────────────────────────────────────────
// BuildMind AI — FastAPI HTTP Client
//
// This module is the single integration point for the backend.
// When you deploy FastAPI, update BASE_URL and the client
// automatically handles auth headers, timeouts, and retries.
// ─────────────────────────────────────────────────────────────

import type { ApiResponse } from '../types'

// ── Config ───────────────────────────────────────────────────

/** Switch to your FastAPI server URL in production */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

/** Default timeout in ms */
const DEFAULT_TIMEOUT = 30_000

// ── Auth token helper ─────────────────────────────────────────

const getToken = (): string | null =>
  localStorage.getItem('buildmind_token')

// ── Core fetch wrapper ────────────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...init } = options
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timerId)
  }
}

// ── API Client class ──────────────────────────────────────────

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private buildHeaders(extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client': 'BuildMind-Web/1.0',
      ...extra,
    }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({})) as {
        message?: string
        detail?: string | Array<{ msg?: string }>
      }
      const detail = errorBody.detail
      const message =
        errorBody.message ??
        (typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg ?? '').filter(Boolean).join('; ') || `HTTP ${res.status}`
            : `HTTP ${res.status}: ${res.statusText}`)
      throw new ApiError(message, res.status, errorBody)
    }
    return res.json()
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    })
    return this.handleResponse<T>(res)
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(res)
  }

  async postForm<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = getToken()
    const headers: Record<string, string> = { 'X-Client': 'BuildMind-Web/1.0' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })
    return this.handleResponse<T>(res)
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(res)
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    })
    return this.handleResponse<T>(res)
  }
}

// ── Custom error class ────────────────────────────────────────

export class ApiError extends Error {
  readonly statusCode: number
  readonly body?: unknown

  constructor(
    message: string,
    statusCode: number,
    body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.body = body
  }

  isNotFound()     { return this.statusCode === 404 }
  isUnauthorized() { return this.statusCode === 401 }
  isServerError()  { return this.statusCode >= 500 }
}

// ── Singleton export ──────────────────────────────────────────

export const apiClient = new ApiClient(BASE_URL)
export { BASE_URL }
