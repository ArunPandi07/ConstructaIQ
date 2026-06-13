import type { Task } from 'gantt-task-react'
import type { CrewPlanRead, ProjectPhase } from '../types'

const PHASE_COLORS = [
  '#F5C518',
  '#E2B30D',
  '#1a2035',
  '#78716c',
  '#0ea5e9',
  '#16a34a',
  '#ea580c',
  '#8b5cf6',
] as const

const CRITICAL_BAR = '#F5C518'
const CRITICAL_PROGRESS = '#1a2035'
const MS_PER_DAY = 86_400_000
const MAX_CREW_LABEL = 42

export type CrewScheduleStatus = 'upcoming' | 'active' | 'completed'

export interface CrewScheduleContext {
  phases?: ProjectPhase[]
  criticalPhases?: string[]
}

export interface CrewGanttWarning {
  id: string
  crewPlanId?: number
  phaseName: string
  message: string
  severity: 'warning' | 'info'
}

export interface CrewGanttSummary {
  crewCount: number
  scheduledCount: number
  totalHeadcount: number
  totalLabor: number
  timelineStart: Date | null
  timelineEnd: Date | null
}

export interface CrewGanttLegendItem {
  phaseName: string
  color: string
  crewCount: number
  isCritical: boolean
}

export interface CrewGanttModel {
  tasks: Task[]
  unscheduled: CrewPlanRead[]
  summary: CrewGanttSummary
  warnings: CrewGanttWarning[]
  legend: CrewGanttLegendItem[]
  planByTaskId: Map<string, CrewPlanRead>
}

export interface BuildCrewGanttOptions {
  scheduleContext?: CrewScheduleContext
  collapsedPhases?: Set<string>
  filterText?: string
}

export function parseCrewDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function normalizePhaseName(name: string): string {
  return name.trim().toLowerCase()
}

function phaseColor(phaseName: string, isCritical: boolean): string {
  if (isCritical) return CRITICAL_BAR
  let hash = 0
  for (let i = 0; i < phaseName.length; i++) {
    hash = (hash + phaseName.charCodeAt(i)) % PHASE_COLORS.length
  }
  return PHASE_COLORS[hash] ?? PHASE_COLORS[0]
}

function phaseTaskId(phaseName: string): string {
  const slug = phaseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `phase-${slug || 'general'}`
}

function truncateLabel(value: string, max = MAX_CREW_LABEL): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

export function computeCrewProgress(
  start: Date,
  end: Date,
  today = new Date(),
): number {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const s = new Date(start)
  s.setHours(0, 0, 0, 0)
  const e = new Date(end)
  e.setHours(0, 0, 0, 0)
  if (e.getTime() <= s.getTime()) return 100
  if (t < s) return 0
  if (t >= e) return 100
  const total = e.getTime() - s.getTime()
  const elapsed = t.getTime() - s.getTime()
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

export function computeCrewStatus(
  start: Date,
  end: Date,
  today = new Date(),
): CrewScheduleStatus {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const s = new Date(start)
  s.setHours(0, 0, 0, 0)
  const e = new Date(end)
  e.setHours(0, 0, 0, 0)
  if (t < s) return 'upcoming'
  if (t >= e) return 'completed'
  return 'active'
}

function criticalPhaseSet(criticalPhases?: string[]): Set<string> {
  return new Set((criticalPhases ?? []).map(normalizePhaseName))
}

function findSchedulePhase(
  phaseName: string,
  phases: ProjectPhase[] | undefined,
): ProjectPhase | undefined {
  if (!phases?.length) return undefined
  const key = normalizePhaseName(phaseName)
  return phases.find((p) => normalizePhaseName(p.name) === key)
}

function parseLabor(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

function matchesFilter(plan: CrewPlanRead, filterText: string): boolean {
  const q = filterText.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    plan.phase_name,
    plan.crew_name,
    plan.skill_type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

function buildScheduleWarnings(
  plans: CrewPlanRead[],
  unscheduled: CrewPlanRead[],
  scheduleContext?: CrewScheduleContext,
): CrewGanttWarning[] {
  if (!scheduleContext) return []
  const critical = criticalPhaseSet(scheduleContext.criticalPhases)
  const warnings: CrewGanttWarning[] = []

  for (const plan of unscheduled) {
    const phase = plan.phase_name ?? 'General'
    if (critical.has(normalizePhaseName(phase))) {
      warnings.push({
        id: `unscheduled-${plan.crew_plan_id}`,
        crewPlanId: plan.crew_plan_id,
        phaseName: phase,
        message: `Critical phase "${phase}" has crew "${plan.crew_name ?? 'Crew'}" without schedule dates.`,
        severity: 'warning',
      })
    }
  }

  for (const plan of plans) {
    const phaseName = plan.phase_name ?? 'General'
    const schedulePhase = findSchedulePhase(phaseName, scheduleContext.phases)
    if (!schedulePhase) continue

    const crewStart = parseCrewDate(plan.start_date)
    const crewEnd = parseCrewDate(plan.end_date)
    const phaseStart = parseCrewDate(schedulePhase.startDate)
    const phaseEnd = parseCrewDate(schedulePhase.endDate)

    if (!crewStart || !crewEnd) continue

    if (phaseStart && crewStart < phaseStart) {
      warnings.push({
        id: `early-${plan.crew_plan_id}`,
        crewPlanId: plan.crew_plan_id,
        phaseName,
        message: `Crew starts before phase window (${schedulePhase.startDate || 'TBD'}).`,
        severity: 'warning',
      })
    }
    if (phaseEnd && crewEnd > phaseEnd) {
      warnings.push({
        id: `late-${plan.crew_plan_id}`,
        crewPlanId: plan.crew_plan_id,
        phaseName,
        message: `Crew ends after phase window (${schedulePhase.endDate || 'TBD'}).`,
        severity: 'warning',
      })
    }
  }

  return warnings
}

export function buildCrewGanttModel(
  plans: CrewPlanRead[],
  options: BuildCrewGanttOptions = {},
): CrewGanttModel {
  const { scheduleContext, collapsedPhases, filterText = '' } = options
  const critical = criticalPhaseSet(scheduleContext?.criticalPhases)
  const filteredPlans = plans.filter((p) => matchesFilter(p, filterText))

  const unscheduled: CrewPlanRead[] = []
  const scheduled: Array<{ plan: CrewPlanRead; start: Date; end: Date }> = []
  const planByTaskId = new Map<string, CrewPlanRead>()

  for (const plan of filteredPlans) {
    const start = parseCrewDate(plan.start_date)
    const endRaw = parseCrewDate(plan.end_date)
    if (!start || !endRaw) {
      unscheduled.push(plan)
      continue
    }
    let end = endRaw
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + MS_PER_DAY)
    }
    scheduled.push({ plan, start, end })
  }

  const groups = new Map<string, Array<{ plan: CrewPlanRead; start: Date; end: Date }>>()
  for (const row of scheduled) {
    const phase = row.plan.phase_name ?? 'General'
    const list = groups.get(phase) ?? []
    list.push(row)
    groups.set(phase, list)
  }

  const phaseNames = [...groups.keys()].sort((a, b) => a.localeCompare(b))
  const tasks: Task[] = []
  let displayOrder = 0

  for (const phaseName of phaseNames) {
    const rows = groups.get(phaseName) ?? []
    rows.sort((a, b) => a.start.getTime() - b.start.getTime())

    const phaseStart = new Date(
      Math.min(...rows.map((r) => r.start.getTime())),
    )
    const phaseEnd = new Date(Math.max(...rows.map((r) => r.end.getTime())))
    const isCritical =
      critical.has(normalizePhaseName(phaseName)) ||
      rows.some((_r) => findSchedulePhase(phaseName, scheduleContext?.phases)?.isCritical)
    const barColor = phaseColor(phaseName, isCritical)
    const progressColor = isCritical ? CRITICAL_PROGRESS : '#1a2035'
    const parentId = phaseTaskId(phaseName)
    const childProgress =
      rows.reduce((sum, r) => sum + computeCrewProgress(r.start, r.end), 0) /
      rows.length

    tasks.push({
      id: parentId,
      type: 'project',
      name: phaseName,
      start: phaseStart,
      end: phaseEnd,
      progress: Math.round(childProgress),
      isDisabled: true,
      hideChildren: collapsedPhases?.has(parentId) ?? false,
      displayOrder,
      styles: {
        backgroundColor: isCritical ? '#fef3c7' : '#e7e5e4',
        backgroundSelectedColor: isCritical ? '#fde68a' : '#d6d3d1',
        progressColor: progressColor,
        progressSelectedColor: progressColor,
      },
    })
    displayOrder += 1

    for (const { plan, start, end } of rows) {
      const taskId = String(plan.crew_plan_id)
      planByTaskId.set(taskId, plan)
      const progress = computeCrewProgress(start, end)
      tasks.push({
        id: taskId,
        type: 'task',
        name: truncateLabel(plan.crew_name ?? 'Crew'),
        project: parentId,
        start,
        end,
        progress,
        isDisabled: true,
        displayOrder,
        styles: {
          backgroundColor: barColor,
          backgroundSelectedColor: barColor,
          progressColor: progressColor,
          progressSelectedColor: progressColor,
        },
      })
      displayOrder += 1
    }
  }

  const summary: CrewGanttSummary = {
    crewCount: filteredPlans.length,
    scheduledCount: scheduled.length,
    totalHeadcount: filteredPlans.reduce(
      (sum, p) => sum + (p.headcount ?? 0),
      0,
    ),
    totalLabor: filteredPlans.reduce((sum, p) => sum + parseLabor(p.labor_cost), 0),
    timelineStart:
      scheduled.length > 0
        ? new Date(Math.min(...scheduled.map((r) => r.start.getTime())))
        : null,
    timelineEnd:
      scheduled.length > 0
        ? new Date(Math.max(...scheduled.map((r) => r.end.getTime())))
        : null,
  }

  const legend: CrewGanttLegendItem[] = phaseNames
    .map((phaseName) => {
      const rows = groups.get(phaseName) ?? []
      const isCritical =
        critical.has(normalizePhaseName(phaseName)) ||
        Boolean(findSchedulePhase(phaseName, scheduleContext?.phases)?.isCritical)
      return {
        phaseName,
        color: phaseColor(phaseName, isCritical),
        crewCount: rows.length,
        isCritical,
      }
    })
    .sort((a, b) => b.crewCount - a.crewCount)

  const warnings = buildScheduleWarnings(
    filteredPlans,
    unscheduled,
    scheduleContext,
  )

  return {
    tasks,
    unscheduled,
    summary,
    warnings,
    legend,
    planByTaskId,
  }
}

/** @deprecated Use buildCrewGanttModel */
export function mapCrewPlansToGanttTasks(plans: CrewPlanRead[]): {
  tasks: Task[]
  unscheduled: CrewPlanRead[]
} {
  const model = buildCrewGanttModel(plans)
  return { tasks: model.tasks, unscheduled: model.unscheduled }
}

export function formatCrewPlanLabel(plan: CrewPlanRead): string {
  const phase = plan.phase_name ?? 'General'
  const crew = plan.crew_name ?? 'Crew'
  return `${phase} · ${crew}`
}

export function formatLaborCost(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `$${num.toLocaleString()}`
}

export function formatTimelineSpan(start: Date | null, end: Date | null): string {
  if (!start || !end) return '—'
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} → ${fmt(end)}`
}

export function formatDurationDays(start: Date | null, end: Date | null): string {
  if (!start || !end) return '—'
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY),
  )
  return `${days} days`
}

export function statusLabel(status: CrewScheduleStatus): string {
  switch (status) {
    case 'upcoming':
      return 'Upcoming'
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
  }
}
