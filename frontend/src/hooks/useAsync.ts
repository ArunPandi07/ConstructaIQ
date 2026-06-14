// ─────────────────────────────────────────────────────────────
// Generic async data-fetching hook
// Used by all page-level hooks below.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseAsyncState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
  refetch: () => void
}

export function useAsync<T>(
  fetcher: () => Promise<{ data: T }>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true },
): UseAsyncState<T> {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(options.immediate !== false)
  const [error,   setError]   = useState<string | null>(null)

  const mountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const run = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      if (mountedRef.current) setData(res.data)
    } catch (err: unknown) {
      if (mountedRef.current) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(msg)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (options.immediate !== false) run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { data, loading, error, refetch: run }
}
