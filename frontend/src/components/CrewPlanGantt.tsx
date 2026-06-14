import { useMemo, useState } from "react";
import { Gantt, ViewMode, type Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import {
  CalendarDays,
  Users,
  DollarSign,
  Clock,
  BarChart3,
} from "lucide-react";
import type { CrewPlanRead } from "../types";
import {
  formatCrewPlanLabel,
  formatLaborCost,
  mapCrewPlansToGanttTasks,
} from "../utils/crewGanttMapper";

interface CrewPlanGanttProps {
  plans: CrewPlanRead[];
  className?: string;
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 64;

export default function CrewPlanGantt({
  plans,
  className = "",
}: CrewPlanGanttProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [selected, setSelected] = useState<CrewPlanRead | null>(null);

  const { tasks, unscheduled } = useMemo(
    () => mapCrewPlansToGanttTasks(plans),
    [plans],
  );

  const chartHeight = Math.max(
    HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 24,
    280,
  );

  const selectedPlan =
    selected ??
    (tasks.length > 0
      ? (plans.find((p) => String(p.crew_plan_id) === tasks[0].id) ?? null)
      : null);

  const handleTaskClick = (task: Task) => {
    const plan = plans.find((p) => String(p.crew_plan_id) === task.id);
    if (plan) setSelected(plan);
  };

  const totalLaborCost = plans.reduce((sum, p) => {
    const cost =
      typeof p.labor_cost === "number" ? p.labor_cost : Number(p.labor_cost);
    return sum + (Number.isNaN(cost) ? 0 : cost);
  }, 0);

  const uniqueCrews = new Set(plans.map((p) => p.crew_name).filter(Boolean))
    .size;

  return (
    <div className={`w-full ${className}`}>
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 hover:border-[#F5C518]/40 transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#F5C518]" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Total Plans
            </span>
          </div>
          <p className="text-lg font-black text-stone-900">{plans.length}</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 hover:border-[#F5C518]/40 transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Labor Cost
            </span>
          </div>
          <p className="text-lg font-black text-stone-900">
            {formatLaborCost(totalLaborCost)}
          </p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 hover:border-[#F5C518]/40 transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Crews
            </span>
          </div>
          <p className="text-lg font-black text-stone-900">{uniqueCrews}</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 hover:border-[#F5C518]/40 transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Scheduled
            </span>
          </div>
          <p className="text-lg font-black text-stone-900">
            {tasks.length}/{plans.length}
          </p>
        </div>
      </div>

      {/* HEADER WITH VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#F5C518]" />
          <span className="text-sm font-bold text-stone-900">
            Crew Timeline
          </span>
          <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
            {tasks.length} scheduled
          </span>
        </div>
        <div className="flex text-xs self-start bg-stone-100 p-1 rounded-xl">
          {([ViewMode.Week, ViewMode.Month] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                viewMode === mode
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {mode === ViewMode.Week ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* GANTT CHART */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up-slow">
          <CalendarDays className="w-10 h-10 text-stone-300 mb-3" />
          <p className="text-sm font-semibold text-stone-500">
            No scheduled crew plans
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Run analyze to populate the timeline with schedule data.
          </p>
        </div>
      ) : (
        <div className="crew-gantt-wrap w-full overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs animate-fade-in-up">
          <div style={{ minWidth: 720, height: chartHeight }}>
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              onClick={handleTaskClick}
              listCellWidth="200px"
              rowHeight={ROW_HEIGHT}
              columnWidth={viewMode === ViewMode.Month ? 60 : 56}
              headerHeight={HEADER_HEIGHT}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="12px"
              todayColor="rgba(245, 197, 24, 0.12)"
              barCornerRadius={4}
              locale="en-GB"
            />
          </div>
        </div>
      )}

      {/* SELECTED PLAN DETAILS */}
      {selectedPlan && tasks.length > 0 && (
        <div className="mt-4 premium-card p-4 cursor-default! animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518]"></span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Selected Plan
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
              <span className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                Phase
              </span>
              <span className="text-xs font-bold text-stone-800">
                {selectedPlan.phase_name ?? "General"}
              </span>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
              <span className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                Crew
              </span>
              <span className="text-xs font-bold text-stone-800">
                {selectedPlan.crew_name ?? "—"}
              </span>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
              <span className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                Start
              </span>
              <span className="text-xs font-bold text-stone-800">
                {selectedPlan.start_date ?? "—"}
              </span>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
              <span className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                End
              </span>
              <span className="text-xs font-bold text-stone-800">
                {selectedPlan.end_date ?? "—"}
              </span>
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
              <span className="text-[9px] font-bold text-stone-400 uppercase block mb-0.5">
                Labor
              </span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-black text-stone-800">
                  {formatLaborCost(selectedPlan.labor_cost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNSCHEDULED ALLOCATIONS */}
      {unscheduled.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-200 animate-fade-in-up-slow">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-[#F5C518]" />
            <span className="text-sm font-bold text-stone-900">
              Unscheduled
            </span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              {unscheduled.length} need dates
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unscheduled.map((plan) => {
              const phaseColor = plan.phase_name
                ? `hsl(${(plan.phase_name.length * 37) % 360}, 55%, 60%)`
                : "#78716c";
              return (
                <div
                  key={plan.crew_plan_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/60 hover:border-[#F5C518]/40 hover:shadow-sm transition-all duration-200 text-xs"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: phaseColor }}
                  >
                    {plan.phase_name?.charAt(0) ?? "G"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-800 truncate">
                      {formatCrewPlanLabel(plan)}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Labor: {formatLaborCost(plan.labor_cost)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
