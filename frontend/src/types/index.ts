// ─────────────────────────────────────────────────────────────
// BuildMind AI — Core TypeScript Interfaces
// Designed to mirror FastAPI Pydantic response schemas exactly.
// ─────────────────────────────────────────────────────────────

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
  complexity:        'Low' | 'Medium' | 'High' | 'Very High'
  type:              string
  squareFootage:     string
  requiredPermits:   Permit[]
  crewRequirements:  CrewRequirement[]
  phases:            ProjectPhase[]
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
