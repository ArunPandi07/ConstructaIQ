import { useMemo, useState } from 'react'
import { Gantt, ViewMode, type Task } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
} from 'lucide-react'
import type { CrewPlanRead, ProjectPhase } from '../types'
import {
  buildCrewGanttModel,
  computeCrewStatus,
  formatCrewPlanLabel,
  formatDurationDays,
  formatLaborCost,
  formatTimelineSpan,
  parseCrewDate,
  statusLabel,
} from '../utils/crewGanttMapper'

interface CrewPlanGanttProps {
  plans: CrewPlanRead[]
  phases?: ProjectPhase[]
  criticalPathPhases?: string[]
  onOpenScheduleTab?: () => void
  className?: string
}

const ROW_HEIGHT = 40
const HEADER_HEIGHT = 52
const MAX_CHART_HEIGHT = 420

function CrewGanttTooltip({
  task,
  planByTaskId,
}: {
  task: Task
  planByTaskId: Map<string, CrewPlanRead>
}) {
  const plan = planByTaskId.get(task.id)
  if (!plan) {
    return (
      <div className="text-xs text-stone-700 px-2 py-1">
        <strong>{task.name}</strong>
      </div>
    )
  }
  const start = parseCrewDate(plan.start_date)
  const end = parseCrewDate(plan.end_date)
  const status = start && end ? computeCrewStatus(start, end) : null

  return (
    <div className="text-xs text-stone-800 px-2 py-1 space-y-0.5 max-w-[240px]">
      <div className="font-bold">{plan.crew_name ?? 'Crew'}</div>
      <div>{plan.phase_name ?? 'General'}</div>
      {plan.skill_type && <div className="text-stone-500">{plan.skill_type}</div>}
      {plan.headcount != null && <div>Headcount: {plan.headcount}</div>}
      <div>Labor: {formatLaborCost(plan.labor_cost)}</div>
      {start && end && (
        <>
          <div>{formatTimelineSpan(start, end)}</div>
          <div>{formatDurationDays(start, end)}</div>
          {status && <div>Status: {statusLabel(status)}</div>}
        </>
      )}
    </div>
  )
}

export default function CrewPlanGantt({
  plans,
  phases,
  criticalPathPhases,
  onOpenScheduleTab,
  className = '',
}: CrewPlanGanttProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set())
  const [warningsOpen, setWarningsOpen] = useState(true)

  const phaseOptions = useMemo(() => {
    const names = new Set(plans.map((p) => p.phase_name ?? 'General'))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [plans])

  const filteredPlans = useMemo(() => {
    if (phaseFilter === 'all') return plans
    return plans.filter((p) => (p.phase_name ?? 'General') === phaseFilter)
  }, [plans, phaseFilter])

  const scheduleContext = useMemo(
    () => ({ phases, criticalPhases: criticalPathPhases }),
    [phases, criticalPathPhases],
  )

  const model = useMemo(
    () =>
      buildCrewGanttModel(filteredPlans, {
        scheduleContext,
        collapsedPhases,
        filterText,
      }),
    [filteredPlans, scheduleContext, collapsedPhases, filterText],
  )

  const { tasks, unscheduled, summary, warnings, legend, planByTaskId } = model

  const chartHeight = Math.min(
    MAX_CHART_HEIGHT,
    Math.max(HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 16, 220),
  )

  const columnWidth =
    viewMode === ViewMode.Month ? 48 : viewMode === ViewMode.Day ? 40 : 56

  const selectedPlan = useMemo(() => {
    if (!selectedTaskId) return null
    const direct = planByTaskId.get(selectedTaskId)
    if (direct) return direct
    const child = tasks.find((t) => t.id === selectedTaskId && t.type === 'task')
    if (child) return planByTaskId.get(child.id) ?? null
    return null
  }, [selectedTaskId, planByTaskId, tasks])

  const detailPlan =
    selectedPlan ??
    (tasks.find((t) => t.type === 'task')
      ? planByTaskId.get(tasks.find((t) => t.type === 'task')!.id) ?? null
      : null)

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id)
    if (task.type === 'project') {
      const firstChild = tasks.find((t) => t.project === task.id && t.type === 'task')
      if (firstChild) setSelectedTaskId(firstChild.id)
    }
  }

  const handleExpanderClick = (task: Task) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(task.id)) next.delete(task.id)
      else next.add(task.id)
      return next
    })
  }

  const activeHeadcount =
    summary.totalHeadcount > 0
      ? summary.totalHeadcount
      : plans.reduce((sum, p) => sum + (p.headcount ?? 0), 0)

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
          {([ViewMode.Day, ViewMode.Week, ViewMode.Month] as const).map((mode) => (
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
              {mode === ViewMode.Day ? 'Day' : mode === ViewMode.Week ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
          <p className="text-[9px] uppercase font-bold text-stone-400">Crews</p>
          <p className="text-sm font-black text-stone-900">
            {summary.scheduledCount}/{summary.crewCount} scheduled
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
          <p className="text-[9px] uppercase font-bold text-stone-400">Headcount</p>
          <p className="text-sm font-black text-stone-900">{activeHeadcount}</p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
          <p className="text-[9px] uppercase font-bold text-stone-400">Labor total</p>
          <p className="text-sm font-black text-stone-900">
            {formatLaborCost(summary.totalLabor)}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
          <p className="text-[9px] uppercase font-bold text-stone-400">Timeline</p>
          <p className="text-[11px] font-bold text-stone-900 leading-tight">
            {formatTimelineSpan(summary.timelineStart, summary.timelineEnd)}
          </p>
        </div>
      </div>

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {legend.slice(0, 6).map((item) => (
            <span
              key={item.phaseName}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border border-stone-200 bg-white text-stone-600"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {item.phaseName}
              {item.isCritical && (
                <span className="text-[#E2B30D] uppercase text-[8px]">Critical</span>
              )}
              <span className="text-stone-400">({item.crewCount})</span>
            </span>
          ))}
          {legend.length > 6 && (
            <span className="text-[10px] text-stone-400 px-2 py-1">
              +{legend.length - 6} more
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="search"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search crew, phase, or skill…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F5C518]/40"
          />
        </div>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="text-xs rounded-lg border border-stone-200 bg-white px-3 py-2 min-w-[140px]"
        >
          <option value="all">All phases</option>
          {phaseOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {warnings.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50">
          <button
            type="button"
            onClick={() => setWarningsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-900"
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Schedule alignment ({warnings.length})
            </span>
            {warningsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {warningsOpen && (
            <ul className="px-3 pb-3 space-y-1.5 text-xs text-amber-900">
              {warnings.map((w) => (
                <li key={w.id} className="flex gap-2">
                  <span className="font-semibold shrink-0">{w.phaseName}:</span>
                  <span>{w.message}</span>
                </li>
              ))}
              {onOpenScheduleTab && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenScheduleTab}
                    className="text-[#1a2035] font-bold underline underline-offset-2"
                  >
                    View schedule
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-xs text-stone-500 py-8 text-center">
          {plans.length === 0
            ? 'No crew plans yet. Run analyze to populate the timeline.'
            : 'No scheduled crews match your filters. Clear search or pick another phase.'}
        </p>
      ) : (
        <div
          className="crew-gantt-wrap w-full overflow-auto rounded-xl border border-stone-200 bg-white"
          style={{ maxHeight: MAX_CHART_HEIGHT }}
        >
          <div style={{ minWidth: 720, height: chartHeight }}>
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              viewDate={summary.timelineStart ?? undefined}
              onClick={handleTaskClick}
              onExpanderClick={handleExpanderClick}
              listCellWidth="220px"
              rowHeight={ROW_HEIGHT}
              columnWidth={columnWidth}
              headerHeight={HEADER_HEIGHT}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="12px"
              todayColor="rgba(245, 197, 24, 0.12)"
              barCornerRadius={4}
              TooltipContent={(props) => (
                <CrewGanttTooltip task={props.task} planByTaskId={planByTaskId} />
              )}
            />
          </div>
        </div>
      )}

      {detailPlan && (
        <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <strong className="text-stone-800">Phase:</strong>{' '}
            {detailPlan.phase_name ?? 'General'}
          </span>
          <span>
            <strong className="text-stone-800">Crew:</strong>{' '}
            {detailPlan.crew_name ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Skill:</strong>{' '}
            {detailPlan.skill_type ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Headcount:</strong>{' '}
            {detailPlan.headcount ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Start:</strong>{' '}
            {detailPlan.start_date ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">End:</strong>{' '}
            {detailPlan.end_date ?? '—'}
          </span>
          <span>
            <strong className="text-stone-800">Duration:</strong>{' '}
            {formatDurationDays(
              parseCrewDate(detailPlan.start_date),
              parseCrewDate(detailPlan.end_date),
            )}
          </span>
          <span>
            <strong className="text-stone-800">Labor:</strong>{' '}
            {formatLaborCost(detailPlan.labor_cost)}
          </span>
          {detailPlan.start_date && detailPlan.end_date && (
            <span>
              <strong className="text-stone-800">Status:</strong>{' '}
              {statusLabel(
                computeCrewStatus(
                  parseCrewDate(detailPlan.start_date)!,
                  parseCrewDate(detailPlan.end_date)!,
                ),
              )}
            </span>
          )}
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
                <span className="text-stone-500 block">
                  {plan.skill_type ?? 'Skill not set'}
                  {plan.headcount != null ? ` · ${plan.headcount} workers` : ''}
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
