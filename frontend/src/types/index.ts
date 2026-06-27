// ─────────────────────────────────────────────────────────────
// BuildMind AI — Core TypeScript Interfaces
// Designed to mirror FastAPI Pydantic response schemas exactly.
// ─────────────────────────────────────────────────────────────

export type { BuildingDefinition } from "./building";

// ── Authentication ───────────────────────────────────────────

export interface User {
  user_id: number
  email: string
  full_name: string
  is_active: boolean
  report_email_opt_in: boolean
  created_at: string
  updated_at: string
}

// ── Shared Primitives ────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: string;
  status: 'LIVE' | 'PENDING' | 'UPCOMING';
  progress: number;
  location: string;
  createdAt: string;
  leadIcon: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type Status   = 'pending' | 'running' | 'complete' | 'error' | 'warning'
export type BadgeVariant = 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'gray'

export interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── KPI / Dashboard ──────────────────────────────────────────

export interface KPIMetrics {
  activeProjects:  number
  riskProjects:    number
  onTimeProjects:  number
  totalBudget:     string
  openRisks:       number
  recoveryPlans:   number
}

export interface HealthTrendPoint {
  month:   string
  health:  number
  risk:    number
  onTime:  number
}

export interface RiskCategoryShare {
  name:  string
  value: number
  color: string
}

export interface AgentActivityItem {
  id:       number
  agent:    string
  action:   string
  time:     string
  severity: Severity
  icon:     string
}

export interface RecommendationItem {
  id:             number
  project:        string
  recommendation: string
  confidence:     number
  impact:         'Critical' | 'High' | 'Medium' | 'Low'
  category:       string
}

export interface DashboardData {
  kpi:                 KPIMetrics
  healthTrend:         HealthTrendPoint[]
  riskDistribution:    RiskCategoryShare[]
  recentActivities:    AgentActivityItem[]
  recentRecommendations: RecommendationItem[]
  totalTokensRecent?:  number
  meanProgress?:       number
}

// ── Project Upload ───────────────────────────────────────────

export type FileType    = 'contract' | 'blueprint'
export type FileStatus  = 'uploading' | 'processing' | 'complete' | 'error'
export type AgentStepStatus = 'pending' | 'running' | 'complete' | 'error'

export interface UploadedFile {
  id:       string
  name:     string
  size:     number
  type:     FileType
  status:   FileStatus
  progress: number
  /** Populated after successful upload — used to identify the project in subsequent API calls */
  projectId?: string
}

export interface AgentProcessingStep {
  id:          string
  name:        string
  description: string
  duration:    number   // ms (mock only; real value from server)
  status:      AgentStepStatus
  startedAt?:  string
  completedAt?: string
}

export interface UploadSessionResponse {
  sessionId:    string
  projectId:    string
  status:       'queued' | 'processing' | 'complete' | 'error'
  agentSteps:   AgentProcessingStep[]
  overallPct:   number
}

// ── Project Intelligence ─────────────────────────────────────

export type PermitStatus = 'Approved' | 'Pending' | 'In Review' | 'Not Started'
export type CrewStatus   = 'Assigned' | 'Partial' | 'Recruiting'
export type PhaseStatus  = 'completed' | 'in-progress' | 'pending'

export interface Permit {
  name:   string
  status: PermitStatus
  date:   string
}

export interface CrewRequirement {
  role:   string
  count:  number
  status: CrewStatus
}

export interface ProjectPhase {
  name:      string
  status:    PhaseStatus
  startDate: string
  endDate:   string
  progress:  number   // 0–100
  isCritical?: boolean
}

export interface BudgetBreakdown {
  total: string
  material: string
  labor: string
  equipment: string
  contingency: string
  totalRaw?: number
  materialRaw?: number
  laborRaw?: number
  equipmentRaw?: number
  contingencyRaw?: number
}

export interface ScheduleDependency {
  predecessor: string
  successor: string
  lagDays?: number
}

export interface ScheduleMaterial {
  name: string
  materialName?: string
  category?: string
  quantity?: number | string | null
  unit?: string
  unitCost?: number | null
  totalCost?: number | null
  supplierRecordId?: number | null
}

export interface Material {
  material_name?: string
  materialName?: string
  name?: string
  category?: string
  quantity?: number | string | null
  unit?: string | null
  unit_cost?: number | string | null
  unitCost?: number | null
  total_cost?: number | string | null
  totalCost?: number | null
}

export interface ProjectSupplierRow {
  supplier_record_id?: number
  supplier_name?: string | null
  material_name?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
  delivery_date?: string | null
  total_cost?: number | string | null
  [key: string]: unknown
}

export interface Recommendation {
  id: number
  sourceAgent: string
  agentVersion?: string
  category: string
  title: string
  description: string
  priority: "High" | "Medium" | "Low"
  status: "new" | "in_progress" | "completed"
  actionUrl?: string
}

export interface InspectionItem {
  name: string
  phase: string
  status: string
  date: string
}

export interface ProjectRiskItem {
  id: number
  title: string
  severity: string
  detail: string
  status: string
  sourceAgent: string
  category: string
}

export interface ReadinessMetrics {
  agentCompletionPct: number
  permitReadinessPct: number
  phaseProgressPct: number
  procurementReadinessPct: number
  workforceReadinessPct: number
  overallReadinessPct: number
  documentsPct: number
  permitsPct: number
  crewPlanPct: number
  hasBudgetBreakdown?: boolean
}

export interface BlueprintSummaryData {
  construction_type?: string
  stories_above_grade?: number
  structural_steel_tons?: number
  concrete_cy?: number
  curtain_wall_sf?: number
  lateral_system?: string
  mep_highlights?: Record<string, unknown>
  building_features?: unknown
  likely_structural_details?: unknown
  [key: string]: unknown
}

export interface ProjectIntelligenceData {
  name:              string
  projectId:         string
  client:            string
  location:          string
  budget:            string
  duration:          string
  startDate:         string
  endDate:           string
  floors:            number
  complexity:        string
  type:              string
  squareFootage:     string
  requiredPermits:   Permit[]
  crewRequirements:  CrewRequirement[]
  phases:            ProjectPhase[]
  budgetBreakdown?:  BudgetBreakdown | null
  dependencies?:     ScheduleDependency[]
  materials?:        ScheduleMaterial[]
  criticalPathPhases?: string[]
  inspections?:      InspectionItem[]
  supplyChainRisks?: ProjectRiskItem[]
  workforceGaps?:    ProjectRiskItem[]
  blueprintSummary?: BlueprintSummaryData | null
  buildingDefinition?: import("./building").BuildingDefinition | null
  zoningAssessment?: Record<string, unknown> | null
  budgetAnalysis?: Record<string, unknown> | null
  safetyAssessment?: Record<string, unknown> | null
  readiness?:        ReadinessMetrics
  recommendations?:  Recommendation[]
}

// ── Risk Intelligence ────────────────────────────────────────

export interface RiskFactor {
  id:          number
  name:        string
  score:       number   // 0–100
  category:    string
  probability: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low'
  impact:      'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  mitigation:  string
  details:     string[]
}

export interface ReasoningChainNode {
  step:        number
  event:       string
  confidence:  number
  description: string
  color:       string
}

export interface RiskIntelligenceData {
  overallScore:   number
  trend:          'increasing' | 'stable' | 'decreasing'
  topRisks:       RiskFactor[]
  heatmap:        number[][]
  reasoningChain: ReasoningChainNode[]
}

// ── Recovery Center ──────────────────────────────────────────

export interface RecoveryStrategy {
  id:            string
  name:          string
  description:   string
  recommended:   boolean
  aiConfidence:  number
  costImpact:    string
  timeSaved:     string
  riskReduction: string
  details:       string[]
  pros:          string[]
  cons:          string[]
}

// ── Change Impact ────────────────────────────────────────────

export interface ProjectSnapshot {
  floors:          number
  budget:          string
  duration:        string
  permits:         number
  crewSize:        number
  structuralLoad:  string
}

export interface ImpactCategory {
  category:   string
  icon:       string
  value:      string
  percentage: string
  severity:   'high' | 'medium' | 'low'
  details:    string[]
}

export interface Dependency {
  from: string
  to:   string
  type: 'requires' | 'triggers' | 'blocks' | 'may require'
}

export interface ChangeImpactData {
  scenario:    string
  description: string
  before:      ProjectSnapshot
  after:       ProjectSnapshot
  impacts:     ImpactCategory[]
  dependencies: Dependency[]
}

// ── Agents ───────────────────────────────────────────────────

export interface AgentMetrics {
  [key: string]: string | number
}

export interface AgentInfo {
  id:              string
  name:            string
  icon:            string
  status:          Exclude<Status, 'pending'>
  confidence:      number
  processingTime:  string
  model:           string
  latestFindings:  string[]
  metrics:         AgentMetrics
}

export interface AgentTimelineEvent {
  time:  string
  agent: string
  event: string
  type:  'start' | 'success' | 'complete' | 'warning' | 'critical' | 'info' | 'running'
}

export interface AgentInsightsData {
  agents:   AgentInfo[]
  timeline: AgentTimelineEvent[]
  summary: {
    totalRuns:       number
    avgConfidence:   number
    totalFindings:   number
    processingTime:  string
  }
}

// ── Navigation State (cross-page) ────────────────────────────

export interface NavigationState {
  projectId?:   string
  fromUpload?:  boolean
  sessionId?:   string
}

// ── Backend project lifecycle API ────────────────────────────

export interface BackendProjectRead {
  project_id: number
  project_name: string
  project_type?: string | null
  location?: string | null
  client_name?: string | null
  status?: string | null
  start_date?: string | null
  target_completion_date?: string | null
  contract_value?: number | string | null
  duration_months?: number | null
  scope?: string | null
  milestones?: string | null
  square_footage?: number | string | null
  floor_count?: number | null
  complexity_level?: string | null
  priority_score?: number | null
}

export interface ProjectListItem extends BackendProjectRead {
  agent_completed?: number
  supplier_count?: number
  crew_count?: number
  phase_progress?: number | null
}

export interface DashboardApiKPI {
  active_projects: number
  risk_projects: number
  on_time_projects: number
  total_budget: string
  open_risks: number
  recovery_plans: number
}

export interface DashboardApiActivity {
  id: number
  agent: string
  action: string
  time: string
  severity: Severity
  project: string
  project_id: number
}

export interface DashboardApiRecommendation {
  id: number
  project: string
  recommendation: string
  confidence: number
  impact: 'Critical' | 'High' | 'Medium' | 'Low'
  category: string
}

export interface DashboardApiResponse {
  kpi: DashboardApiKPI
  health_trend: HealthTrendPoint[]
  risk_distribution: RiskCategoryShare[]
  recent_activities: DashboardApiActivity[]
  recent_recommendations: DashboardApiRecommendation[]
  total_tokens_recent: number
  projects?: ProjectListItem[]
}

export interface ProjectCreatePayload {
  project_name: string
  project_type?: string
  location?: string
  client_name?: string
  scope?: string
  duration_months?: number
  floor_count?: number
  complexity_level?: string
}

export interface ProjectUploadResponse {
  project_id: number
  documents: Array<{
    document_id?: number
    file_name?: string
    document_type?: string
    has_file?: boolean
    file_size_bytes?: number | null
  }>
}

export interface ProjectDocument {
  document_id: number
  project_id: number
  document_type?: string | null
  file_name?: string | null
  content_type?: string | null
  file_size_bytes?: number | null
  created_at: string
  has_file: boolean
}

export interface ProjectDocumentsResponse {
  project_id: number
  documents: ProjectDocument[]
}

export interface AnalyzeJobResponse {
  job_id: string
  project_id: number
  status: string
}

export interface AnalyzeJobStatus {
  job_id: string
  project_id: number
  status: 'queued' | 'running' | 'complete' | 'error'
  progress_step?: string | null
  overall_pct?: number | null
  result?: AnalyzePipelineResult | null
  error?: string | null
  report_delivery_status?: string | null
  report_delivery_error?: string | null
}

export interface PersistenceSummary {
  permits_created?: number
  permits_deleted?: number
  schedules_created?: number
  schedules_deleted?: number
  budgets_created?: number
  budgets_deleted?: number
  inspections_created?: number
  inspections_deleted?: number
  project_suppliers_created?: number
  project_suppliers_deleted?: number
  crew_plans_created?: number
  crew_plans_deleted?: number
  agent_executions_created?: number
}

export interface AnalyzePipelineResult {
  projectSummary?: Record<string, unknown>
  blueprintSummary?: Record<string, unknown>
  permitAssessment?: Record<string, unknown>
  projectPlan?: Record<string, unknown>
  supplierAnalysis?: Record<string, unknown>
  crewAnalysis?: Record<string, unknown>
  persistenceSummary?: PersistenceSummary
  stored_document_ids?: Record<string, number>
}

export interface ProjectSummaryResponse {
  project: BackendProjectRead
  intelligence: ProjectIntelligenceData
}

export interface ProjectSuppliersResponse {
  project_id: number
  suppliers: ProjectSupplierRow[]
}

export interface CrewPlanRead {
  crew_plan_id: number
  project_id: number
  phase_name?: string | null
  crew_name?: string | null
  labor_cost?: number | string | null
  start_date?: string | null
  end_date?: string | null
  headcount?: number | null
  skill_type?: string | null
  created_at?: string
}

export interface ProjectCrewResponse {
  project_id: number
  crew_plans: CrewPlanRead[]
}

export interface AgentExecutionRead {
  execution_id: number
  project_id: number
  agent_name?: string | null
  agent_version?: string | null
  run_id?: string | null
  status?: string | null
  started_at?: string | null
  completed_at?: string | null
  duration_seconds?: number | null
  tokens_used?: number | null
  output_json?: string | null
  error_message?: string | null
  created_at?: string
}

export interface PipelineRunSummary {
  job_id: string
  status: string
  overall_pct: number
  created_at: string
  updated_at: string
  agent_count: number
  total_duration_seconds: number
  error_message?: string | null
}

export interface ProjectPipelineRunsResponse {
  project_id: number
  runs: PipelineRunSummary[]
}

export interface ProjectAgentsResponse {
  project_id: number
  pipeline_run_count: number
  agents: AgentExecutionRead[]
}
