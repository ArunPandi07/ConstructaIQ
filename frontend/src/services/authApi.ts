import { apiClient } from './apiClient'
import { dedupeAsync } from './requestDedupe'
import type { User } from '../types'

interface LoginResponse {
  access_token: string
  token_type: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getCurrentUser(): Promise<User> {
  return dedupeAsync('auth/me', async () => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  })
}

export async function updateProfile(data: {
  email?: string
  full_name?: string
  current_password?: string
  new_password?: string
  report_email_opt_in?: boolean
}): Promise<User> {
  const response = await apiClient.put<User>('/auth/me', data)
  return response.data
}

export async function register(data: {
  email: string
  password: string
  full_name: string
}): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', data)
  return response.data
}
