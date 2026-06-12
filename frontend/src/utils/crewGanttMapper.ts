import type { Task } from 'gantt-task-react'
import type { CrewPlanRead } from '../types'

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

const MS_PER_DAY = 86_400_000

export function parseCrewDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function phaseColor(phaseName: string): string {
  let hash = 0
  for (let i = 0; i < phaseName.length; i++) {
    hash = (hash + phaseName.charCodeAt(i)) % PHASE_COLORS.length
  }
  return PHASE_COLORS[hash] ?? PHASE_COLORS[0]
}

function computeProgress(end: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (end < today) return 100
  return 0
}

export function mapCrewPlansToGanttTasks(plans: CrewPlanRead[]): {
  tasks: Task[]
  unscheduled: CrewPlanRead[]
} {
  const unscheduled: CrewPlanRead[] = []
  const scheduled: Array<{ plan: CrewPlanRead; start: Date; end: Date }> = []

  for (const plan of plans) {
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

  scheduled.sort((a, b) => {
    const byStart = a.start.getTime() - b.start.getTime()
    if (byStart !== 0) return byStart
    return (a.plan.phase_name ?? '').localeCompare(b.plan.phase_name ?? '')
  })

  const tasks: Task[] = scheduled.map(({ plan, start, end }, index) => {
    const phase = plan.phase_name ?? 'General'
    const crew = plan.crew_name ?? 'Crew'
    const barColor = phaseColor(phase)

    return {
      id: String(plan.crew_plan_id),
      type: 'task',
      name: crew,
      project: phase,
      start,
      end,
      progress: computeProgress(end),
      isDisabled: true,
      displayOrder: index,
      styles: {
        backgroundColor: barColor,
        backgroundSelectedColor: barColor,
        progressColor: '#1a2035',
        progressSelectedColor: '#1a2035',
      },
    }
  })

  return { tasks, unscheduled }
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
