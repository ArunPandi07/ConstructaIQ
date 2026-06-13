import type {
  AnalyzeJobResponse,
  AnalyzeJobStatus,
  AnalyzePipelineResult,
  ApiResponse,
  BackendProjectRead,
  Project,
  ProjectCreatePayload,
  ProjectAgentsResponse,
  ProjectCrewResponse,
  ProjectListItem,
  ProjectSummaryResponse,
  ProjectSuppliersResponse,
  ProjectUploadResponse,
  UploadSessionResponse,
} from '../types'
import { apiClient } from './apiClient'

export function unwrapData<T>(response: ApiResponse<T>): T {
  return response.data
}

export function isBackendProjectId(projectId: string): boolean {
  return /^\d+$/.test(projectId)
}

export async function createProject(
  payload: ProjectCreatePayload,
): Promise<BackendProjectRead> {
  const res = await apiClient.post<BackendProjectRead>('/projects', payload)
  return unwrapData(res)
}

export async function uploadProjectPdfs(
  projectName: string,
  contractFiles: File[],
  blueprintFiles: File[],
): Promise<ProjectUploadResponse> {
  const form = new FormData()
  form.append('project_name', projectName)
  contractFiles.forEach((f) => form.append('contract', f))
  blueprintFiles.forEach((f) => form.append('blueprint', f))
  const res = await apiClient.postForm<ProjectUploadResponse>('/projects/upload', form)
  return unwrapData(res)
}

export async function startAnalyze(
  projectId: number,
  description?: string,
): Promise<AnalyzeJobResponse> {
  const res = await apiClient.post<AnalyzeJobResponse>(
    `/projects/${projectId}/analyze`,
    description ? { description } : {},
  )
  return unwrapData(res)
}

export async function getAnalyzeStatus(
  projectId: number,
  jobId?: string,
): Promise<AnalyzeJobStatus> {
  const params = jobId ? { job_id: jobId } : undefined
  const res = await apiClient.get<AnalyzeJobStatus>(
    `/projects/${projectId}/analyze/status`,
    params,
  )
  return unwrapData(res)
}

export async function getUploadSession(
  projectId: number,
  jobId?: string,
): Promise<UploadSessionResponse> {
  const params = jobId ? { job_id: jobId } : undefined
  const res = await apiClient.get<UploadSessionResponse>(
    `/projects/${projectId}/upload-session`,
    params,
  )
  return unwrapData(res)
}

export async function listProjects(params?: {
  skip?: number
  limit?: number
}): Promise<ProjectListItem[]> {
  const query: Record<string, string> = {}
  if (params?.skip != null) query.skip = String(params.skip)
  if (params?.limit != null) query.limit = String(params.limit)
  const res = await apiClient.get<ProjectListItem[]>(
    '/projects',
    Object.keys(query).length ? query : undefined,
  )
  return unwrapData(res)
}

export async function getProject(projectId: number): Promise<BackendProjectRead> {
  const res = await apiClient.get<BackendProjectRead>(`/projects/${projectId}`)
  return unwrapData(res)
}

export async function getProjectSummary(
  projectId: number,
): Promise<ProjectSummaryResponse> {
  const res = await apiClient.get<ProjectSummaryResponse>(
    `/projects/${projectId}/summary`,
  )
  return unwrapData(res)
}

export async function getProjectSuppliers(
  projectId: number,
): Promise<ProjectSuppliersResponse> {
  const res = await apiClient.get<ProjectSuppliersResponse>(
    `/projects/${projectId}/suppliers`,
  )
  return unwrapData(res)
}

export async function getProjectCrew(
  projectId: number,
): Promise<ProjectCrewResponse> {
  const res = await apiClient.get<ProjectCrewResponse>(`/projects/${projectId}/crew`)
  return unwrapData(res)
}

export async function getProjectAgents(
  projectId: number,
): Promise<ProjectAgentsResponse> {
  const res = await apiClient.get<ProjectAgentsResponse>(
    `/projects/${projectId}/agents`,
  )
  return unwrapData(res)
}

export const PIPELINE_AGENT_NAMES = [
  'ContractAgent',
  'BlueprintAgent',
  'PermitAgent',
  'ScheduleAgent',
  'SupplierAgent',
  'CrewAgent',
] as const

export interface PollAnalyzeOptions {
  intervalMs?: number
  maxAttempts?: number
  onProgress?: (status: AnalyzeJobStatus) => void
}

export async function pollAnalyzeUntilComplete(
  projectId: number,
  jobId: string,
  options: PollAnalyzeOptions = {},
): Promise<AnalyzePipelineResult> {
  const { intervalMs = 1000, maxAttempts = 120, onProgress } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getAnalyzeStatus(projectId, jobId)
    onProgress?.(status)

    if (status.status === 'complete') {
      if (!status.result) {
        throw new Error('Analyze completed but no result payload was returned.')
      }
      return status.result
    }

    if (status.status === 'error') {
      throw new Error(status.error ?? 'Analyze job failed.')
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }

  throw new Error('Analyze job timed out while polling status.')
}

const PIPELINE_AGENT_TOTAL = 6

export function mapBackendStatusToUI(
  status: string | null | undefined,
): Project['status'] {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'uploaded' || normalized === 'pending') return 'PENDING'
  if (normalized === 'active' || normalized === 'live') return 'LIVE'
  if (!normalized) return 'PENDING'
  return 'UPCOMING'
}

export function computeProjectProgress(
  item: Pick<ProjectListItem, 'agent_completed' | 'phase_progress'>,
  fallback = 0,
): number {
  if (item.phase_progress != null && item.phase_progress > 0) {
    return Math.min(100, item.phase_progress)
  }
  if (item.agent_completed != null && item.agent_completed > 0) {
    return Math.round((item.agent_completed / PIPELINE_AGENT_TOTAL) * 100)
  }
  return fallback
}

export function mapBackendProjectToUI(
  project: BackendProjectRead | ProjectListItem,
  progress?: number,
): Project {
  const listItem = project as ProjectListItem
  const budget =
    project.contract_value != null
      ? `$${Number(project.contract_value).toLocaleString()}`
      : 'TBD'

  const resolvedProgress =
    progress ??
    computeProjectProgress(listItem, listItem.agent_completed ? 0 : 0)

  const createdSource = project.start_date
  const createdAt = createdSource
    ? new Date(createdSource).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })

  return {
    id: String(project.project_id),
    name: project.project_name,
    description: project.scope ?? '',
    budget,
    status: mapBackendStatusToUI(project.status),
    progress: resolvedProgress,
    location: project.location ?? 'TBD',
    createdAt,
    leadIcon: 'HardHat',
  }
}

export function mapProjectListToUI(items: ProjectListItem[]): Project[] {
  return items.map((item) => mapBackendProjectToUI(item))
}
