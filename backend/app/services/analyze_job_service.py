from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable

from app.db.session import _get_session_factory
from app.orchestrator.analyze_orchestrator import (
    run_pipeline_from_documents,
    run_pipeline_from_text,
)
from app.services.logging_service import get_logger

logger = get_logger("AnalyzeJobService")

PIPELINE_STEPS = [
    "ContractAgent",
    "BlueprintAgent",
    "PermitAgent",
    "ScheduleAgent",
    "SupplierAgent",
    "CrewAgent",
]


@dataclass
class AnalyzeJob:
    job_id: str
    project_id: int
    status: str  # queued | running | complete | error
    progress_step: str | None = None
    overall_pct: int = 0
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    agent_steps: list[dict[str, Any]] = field(default_factory=list)

    @property
    def frontend_status(self) -> str:
        mapping = {
            "queued": "queued",
            "running": "processing",
            "complete": "complete",
            "error": "error",
        }
        return mapping.get(self.status, self.status)


class AnalyzeJobService:
    def __init__(self) -> None:
        self._jobs: dict[str, AnalyzeJob] = {}

    def create_job(self, project_id: int) -> AnalyzeJob:
        job_id = str(uuid.uuid4())
        steps = [
            {
                "id": step.lower(),
                "name": step,
                "description": f"Running {step}",
                "duration": 0,
                "status": "pending",
            }
            for step in PIPELINE_STEPS
        ]
        job = AnalyzeJob(
            job_id=job_id,
            project_id=project_id,
            status="queued",
            agent_steps=steps,
        )
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> AnalyzeJob | None:
        return self._jobs.get(job_id)

    def get_latest_job_for_project(self, project_id: int) -> AnalyzeJob | None:
        jobs = [j for j in self._jobs.values() if j.project_id == project_id]
        if not jobs:
            return None
        return max(jobs, key=lambda j: j.created_at)

    def _update_progress(self, job: AnalyzeJob, step_name: str) -> None:
        job.progress_step = step_name
        job.status = "running"
        if step_name in PIPELINE_STEPS:
            idx = PIPELINE_STEPS.index(step_name)
            job.overall_pct = int(((idx + 1) / len(PIPELINE_STEPS)) * 100)
            for i, step in enumerate(job.agent_steps):
                if i < idx:
                    step["status"] = "complete"
                elif step["name"] == step_name:
                    step["status"] = "running"
                else:
                    step["status"] = "pending"

    async def run_job(
        self,
        job: AnalyzeJob,
        *,
        project_name: str,
        description: str | None,
        contract_bytes: bytes | None = None,
        contract_filename: str | None = None,
        blueprint_bytes: bytes | None = None,
        blueprint_filename: str | None = None,
    ) -> None:
        job.status = "running"
        progress_callback: Callable[[str], None] = lambda step: self._update_progress(
            job, step
        )

        try:
            factory = _get_session_factory()
            async with factory() as session:
                execution_log: list[dict[str, Any]] = []

                if contract_bytes or blueprint_bytes:
                    result = await run_pipeline_from_documents(
                        project_name=project_name,
                        contract_bytes=contract_bytes,
                        contract_filename=contract_filename,
                        blueprint_bytes=blueprint_bytes,
                        blueprint_filename=blueprint_filename,
                        project_id=job.project_id,
                        session=session,
                        progress_callback=progress_callback,
                        execution_log=execution_log,
                    )
                else:
                    if not description:
                        raise ValueError(
                            "Project has no documents and no description was provided."
                        )
                    result = await run_pipeline_from_text(
                        project_name=project_name,
                        description=description,
                        project_id=job.project_id,
                        session=session,
                        progress_callback=progress_callback,
                        execution_log=execution_log,
                    )

                job.result = result
                job.status = "complete"
                job.overall_pct = 100
                for step in job.agent_steps:
                    step["status"] = "complete"
        except Exception as exc:
            logger.exception("Analyze job %s failed", job.job_id)
            job.status = "error"
            job.error = str(exc)

    def enqueue(
        self,
        job: AnalyzeJob,
        **kwargs: Any,
    ) -> None:
        asyncio.create_task(self.run_job(job, **kwargs))


analyze_job_service = AnalyzeJobService()
