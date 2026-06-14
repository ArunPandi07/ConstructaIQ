import { describe, expect, it } from 'vitest'
import type { CrewPlanRead } from '../types'
import {
  buildCrewGanttModel,
  computeCrewProgress,
  computeCrewStatus,
  formatTimelineSpan,
  normalizePhaseName,
} from './crewGanttMapper'

function plan(
  id: number,
  overrides: Partial<CrewPlanRead> = {},
): CrewPlanRead {
  return {
    crew_plan_id: id,
    project_id: 1,
    phase_name: 'Foundation',
    crew_name: `Crew ${id}`,
    start_date: '2026-03-01',
    end_date: '2026-06-01',
    headcount: 10,
    skill_type: 'Ironworker',
    labor_cost: 50000,
    ...overrides,
  }
}

describe('crewGanttMapper', () => {
  it('builds phase hierarchy with project parent and crew children', () => {
    const model = buildCrewGanttModel([
      plan(1, { crew_name: 'Gang A' }),
      plan(2, { crew_name: 'Gang B', phase_name: 'Foundation' }),
      plan(3, {
        phase_name: 'Steel',
        crew_name: 'Steel Crew',
        start_date: '2026-07-01',
        end_date: '2026-10-01',
      }),
    ])

    expect(model.tasks.filter((t) => t.type === 'project').length).toBe(2)
    expect(model.tasks.filter((t) => t.type === 'task').length).toBe(3)
    const child = model.tasks.find((t) => t.id === '1')
    expect(child?.project).toBeTruthy()
    expect(model.summary.scheduledCount).toBe(3)
    expect(model.summary.totalHeadcount).toBe(30)
  })

  it('splits unscheduled crews', () => {
    const model = buildCrewGanttModel([
      plan(1),
      plan(2, { start_date: null, end_date: null }),
    ])
    expect(model.unscheduled.length).toBe(1)
    expect(model.unscheduled[0].crew_plan_id).toBe(2)
  })

  it('computes elapsed progress between start and end', () => {
    const start = new Date('2026-01-01')
    const end = new Date('2026-01-11')
    const mid = new Date('2026-01-06')
    expect(computeCrewProgress(start, end, mid)).toBe(50)
    expect(computeCrewStatus(start, end, mid)).toBe('active')
    expect(computeCrewStatus(start, end, new Date('2025-12-01'))).toBe('upcoming')
    expect(computeCrewProgress(start, end, new Date('2026-02-01'))).toBe(100)
  })

  it('emits schedule alignment warnings', () => {
    const model = buildCrewGanttModel(
      [
        plan(1, {
          start_date: '2026-01-01',
          end_date: '2026-12-01',
        }),
        plan(2, {
          phase_name: 'Critical Phase',
          start_date: null,
          end_date: null,
        }),
      ],
      {
        scheduleContext: {
          phases: [
            {
              name: 'Foundation',
              status: 'pending',
              startDate: '2026-03-01',
              endDate: '2026-06-01',
              progress: 0,
            },
            {
              name: 'Critical Phase',
              status: 'pending',
              startDate: '2026-04-01',
              endDate: '2026-08-01',
              progress: 0,
              isCritical: true,
            },
          ],
          criticalPhases: ['Critical Phase'],
        },
      },
    )

    expect(model.warnings.some((w) => w.id.startsWith('early-'))).toBe(true)
    expect(model.warnings.some((w) => w.id.startsWith('unscheduled-'))).toBe(true)
  })

  it('filters crews by search text', () => {
    const model = buildCrewGanttModel(
      [plan(1, { crew_name: 'Electric Crew' }), plan(2, { crew_name: 'Plumber' })],
      { filterText: 'electric' },
    )
    expect(model.summary.crewCount).toBe(1)
    expect(model.tasks.find((t) => t.id === '1')).toBeTruthy()
  })

  it('normalizes phase names for matching', () => {
    expect(normalizePhaseName('  Steel Work ')).toBe('steel work')
    expect(formatTimelineSpan(new Date('2026-01-01'), new Date('2026-02-01'))).toContain('2026')
  })
})
