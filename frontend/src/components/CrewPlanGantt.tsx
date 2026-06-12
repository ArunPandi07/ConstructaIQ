import { useMemo, useState } from 'react'
import { Gantt, ViewMode, type Task } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { CalendarDays, Users } from 'lucide-react'
import type { CrewPlanRead } from '../types'
import {
  formatCrewPlanLabel,
  formatLaborCost,
  mapCrewPlansToGanttTasks,
} from '../utils/crewGanttMapper'

interface CrewPlanGanttProps {
  plans: CrewPlanRead[]
  className?: string
}

const ROW_HEIGHT = 44
const HEADER_HEIGHT = 56

export default function CrewPlanGantt({ plans, className = '' }: CrewPlanGanttProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week)
  const [selected, setSelected] = useState<CrewPlanRead | null>(null)

  const { tasks, unscheduled } = useMemo(
    () => mapCrewPlansToGanttTasks(plans),
    [plans],
  )

  const chartHeight = Math.max(
    HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 24,
    280,
  )

  const selectedPlan =
    selected ??
    (tasks.length > 0
      ? plans.find((p) => String(p.crew_plan_id) === tasks[0].id) ?? null
      : null)

  const handleTaskClick = (task: Task) => {
    const plan = plans.find((p) => String(p.crew_plan_id) === task.id)
    if (plan) setSelected(plan)
  }

  return (
    <div className={`glass-card p-5 md:p-6 w-full ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#F5C518]" />
          <h3 className="text-sm font-bold text-stone-900">
            Crew plans ({plans.length})
          </h3>
        </div>
        <div
          className="flex text-xs self-start"
          style={{
            background: 'var(--bg3)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          {([ViewMode.Week, ViewMode.Month] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === mode ? 'shadow-xs' : 'hover:opacity-80'
              }`}
              style={
                viewMode === mode
                  ? { background: 'var(--card)', color: 'var(--text-primary)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {mode === ViewMode.Week ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-stone-500 py-8 text-center">
          No crew plans with schedule dates yet. Run analyze to populate the
          timeline.
        </p>
      ) : (
        <div className="crew-gantt-wrap w-full overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <div style={{ minWidth: 720, height: chartHeight }}>
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              onClick={handleTaskClick}
              listCellWidth="200px"
              rowHeight={ROW_HEIGHT}
              columnWidth={viewMode === ViewMode.Month ? 48 : 56}
              headerHeight={HEADER_HEIGHT}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="12px"
              todayColor="rgba(245, 197, 24, 0.12)"
              barCornerRadius={4}
            />
          </div>
        </div>
      )}

      {selectedPlan && tasks.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <strong className="text-stone-800">Phase:</strong>{' '}
            {selectedPlan.phase_name ?? 'General'}
          </span>
          <span>
            <strong className="text-stone-800">Crew:</strong>{' '}
            {selectedPlan.crew_name ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Start:</strong>{' '}
            {selectedPlan.start_date ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">End:</strong>{' '}
            {selectedPlan.end_date ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Labor:</strong>{' '}
            {formatLaborCost(selectedPlan.labor_cost)}
          </span>
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Unscheduled allocations ({unscheduled.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unscheduled.map((plan) => (
              <div
                key={plan.crew_plan_id}
                className="text-xs p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600"
              >
                <span className="font-semibold text-stone-800 block">
                  {formatCrewPlanLabel(plan)}
                </span>
                <span className="text-stone-500">
                  Labor: {formatLaborCost(plan.labor_cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
