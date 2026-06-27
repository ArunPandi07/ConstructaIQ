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
  ProjectPipelineRunsResponse,
  ProjectSummaryResponse,
  ProjectSuppliersResponse,
  ProjectUploadResponse,
  UploadSessionResponse,
  ProjectDocumentsResponse,
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
  options?: { description?: string; sendReportEmail?: boolean },
): Promise<AnalyzeJobResponse> {
  const body: { description?: string; send_report_email?: boolean } = {}
  if (options?.description) body.description = options.description
  if (options?.sendReportEmail !== undefined) {
    body.send_report_email = options.sendReportEmail
  }
  const res = await apiClient.post<AnalyzeJobResponse>(
    `/projects/${projectId}/analyze`,
    body,
  )
  return unwrapData(res)
}

export async function emailProjectReport(projectId: number): Promise<{
  delivery_id: number
  status: string
  recipient_email: string
  error_message?: string | null
}> {
  const res = await apiClient.post<{
    delivery_id: number
    status: string
    recipient_email: string
    error_message?: string | null
  }>(`/projects/${projectId}/report/email`, {})
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

export async function getProjectDocuments(
  projectId: number,
): Promise<ProjectDocumentsResponse> {
  const res = await apiClient.get<ProjectDocumentsResponse>(
    `/projects/${projectId}/documents`,
  )
  return unwrapData(res)
}

export async function fetchProjectDocumentBlob(
  projectId: number,
  documentId: number,
): Promise<Blob> {
  return apiClient.fetchBlob(`/projects/${projectId}/documents/${documentId}/file`)
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
  runId?: string,
): Promise<ProjectAgentsResponse> {
  const params = runId ? { run_id: runId } : undefined
  const res = await apiClient.get<ProjectAgentsResponse>(
    `/projects/${projectId}/agents`,
    params,
  )
  return unwrapData(res)
}

export async function getProjectPipelineRuns(
  projectId: number,
): Promise<ProjectPipelineRunsResponse> {
  const res = await apiClient.get<ProjectPipelineRunsResponse>(
    `/projects/${projectId}/pipeline-runs`,
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
  'ZoningAgent',
  'BudgetAgent',
  'SafetyAlertAgent',
] as const

export interface PollAnalyzeOptions {
  intervalMs?: number
  maxAttempts?: number
  onProgress?: (status: AnalyzeJobStatus) => void
  onComplete?: (status: AnalyzeJobStatus) => void
}

export async function pollAnalyzeUntilComplete(
  projectId: number,
  jobId: string,
  options: PollAnalyzeOptions = {},
): Promise<AnalyzePipelineResult> {
  const { intervalMs = 3000, maxAttempts = 120, onProgress, onComplete } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getAnalyzeStatus(projectId, jobId)
    onProgress?.(status)

    if (status.status === 'complete') {
      if (status.report_delivery_status === 'pending') {
        await new Promise((r) => setTimeout(r, intervalMs))
        continue
      }
      onComplete?.(status)
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

const PIPELINE_AGENT_TOTAL = 9

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

export interface CallAgentRequest {
  agent_name: string;
  version?: string;
  text: string;
}

export interface CallAgentResponse {
  agent_name: string;
  version: string;
  output: any;
}

export async function callAgentDirectly(payload: CallAgentRequest): Promise<CallAgentResponse> {
  const res = await apiClient.post<CallAgentResponse>('/projects/call-agent', payload);
  return unwrapData(res);
}

export interface ReportDeliveryRead {
  delivery_id: number
  project_id: number
  user_id: number
  job_id?: string | null
  status: string
  recipient_email: string
  subject?: string | null
  provider_message_id?: string | null
  error_message?: string | null
  sent_at?: string | null
  created_at: string
}

export async function getReportDeliveries(projectId: number): Promise<ReportDeliveryRead[]> {
  const res = await apiClient.get<ReportDeliveryRead[]>(`/projects/${projectId}/report/deliveries`)
  return unwrapData(res)
}
