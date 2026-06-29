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
    "ZoningAgent",
    "BudgetAgent",
    "SafetyAlertAgent",
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
    triggering_user_id: int | None = None
    send_report_email: bool = False
    report_delivery_status: str | None = None
    report_delivery_error: str | None = None

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

    def _job_from_db(self, db_job) -> AnalyzeJob:
        steps = [
            {
                "id": step.lower(),
                "name": step,
                "description": f"Running {step}",
                "duration": 0,
                "status": "complete" if db_job.status == "complete" else "pending",
            }
            for step in PIPELINE_STEPS
        ]
        job = AnalyzeJob(
            job_id=db_job.job_id,
            project_id=db_job.project_id,
            status=db_job.status,
            agent_steps=steps,
            triggering_user_id=getattr(db_job, "triggering_user_id", None),
            send_report_email=bool(getattr(db_job, "send_report_email", False)),
        )
        job.overall_pct = db_job.overall_pct
        job.error = db_job.error_message
        job.report_delivery_status = getattr(db_job, "report_delivery_status", None)
        job.report_delivery_error = getattr(db_job, "report_delivery_error", None)
        return job

    async def _save_job_async(self, job: AnalyzeJob) -> None:
        try:
            factory = _get_session_factory()
            async with factory() as session:
                from app.db.models.analyze_job import ProjectAnalyzeJob
                from sqlalchemy import select
                stmt = select(ProjectAnalyzeJob).where(ProjectAnalyzeJob.job_id == job.job_id)
                res = await session.execute(stmt)
                db_job = res.scalar_one_or_none()
                if not db_job:
                    db_job = ProjectAnalyzeJob(
                        job_id=job.job_id,
                        project_id=job.project_id,
                        status=job.status,
                        overall_pct=job.overall_pct,
                        triggering_user_id=job.triggering_user_id,
                        send_report_email=job.send_report_email,
                        report_delivery_status=job.report_delivery_status,
                        report_delivery_error=job.report_delivery_error,
                    )
                    session.add(db_job)
                else:
                    db_job.status = job.status
                    db_job.overall_pct = job.overall_pct
                    db_job.error_message = job.error
                    db_job.triggering_user_id = job.triggering_user_id
                    db_job.send_report_email = job.send_report_email
                    db_job.report_delivery_status = job.report_delivery_status
                    db_job.report_delivery_error = job.report_delivery_error
                await session.commit()
        except Exception as exc:
            logger.warning(
                "Failed to save analyze job to DB (project_id=%s job_id=%s): %s: %s",
                job.project_id,
                job.job_id,
                type(exc).__name__,
                exc,
            )

    async def create_job(
        self,
        project_id: int,
        *,
        triggering_user_id: int | None = None,
        send_report_email: bool = False,
    ) -> AnalyzeJob:
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
            triggering_user_id=triggering_user_id,
            send_report_email=send_report_email,
        )
        self._jobs[job_id] = job
        await self._save_job_async(job)
        return job

    async def get_job(self, job_id: str) -> AnalyzeJob | None:
        if job_id in self._jobs:
            return self._jobs[job_id]
        
        try:
            factory = _get_session_factory()
            async with factory() as session:
                from app.db.models.analyze_job import ProjectAnalyzeJob
                from sqlalchemy import select
                stmt = select(ProjectAnalyzeJob).where(ProjectAnalyzeJob.job_id == job_id)
                res = await session.execute(stmt)
                db_job = res.scalar_one_or_none()
                if db_job:
                    return self._job_from_db(db_job)
        except Exception as e:
            logger.error("Failed to query analyze job from DB: %s", e)
            
        return None

    async def get_latest_job_for_project(self, project_id: int) -> AnalyzeJob | None:
        jobs = [j for j in self._jobs.values() if j.project_id == project_id]
        if jobs:
            return max(jobs, key=lambda j: j.created_at)
        
        try:
            factory = _get_session_factory()
            async with factory() as session:
                from app.db.models.analyze_job import ProjectAnalyzeJob
                from sqlalchemy import select
                stmt = select(ProjectAnalyzeJob).where(ProjectAnalyzeJob.project_id == project_id).order_by(ProjectAnalyzeJob.created_at.desc()).limit(1)
                res = await session.execute(stmt)
                db_job = res.scalar_one_or_none()
                if db_job:
                    return self._job_from_db(db_job)
        except Exception as e:
            logger.error("Failed to query analyze job from DB: %s", e)
            
        return None

    def _update_progress(self, job: AnalyzeJob, step_name: str) -> None:
        NODE_MAP = {
            "contract_node": "ContractAgent",
            "blueprint_node": "BlueprintAgent",
            "permit_node": "PermitAgent",
            "schedule_node": "ScheduleAgent",
            "zoning_node": "ZoningAgent",
            "budget_node": "BudgetAgent",
            "safety_node": "SafetyAlertAgent",
            "supplier_node": "SupplierAgent",
            "crew_node": "CrewAgent",
        }
        mapped_name = NODE_MAP.get(step_name, step_name)
        job.progress_step = mapped_name
        job.status = "running"
        if mapped_name in PIPELINE_STEPS:
            idx = PIPELINE_STEPS.index(mapped_name)
            job.overall_pct = int(((idx + 2) / (len(PIPELINE_STEPS) + 1)) * 100)
            for i, step in enumerate(job.agent_steps):
                if i < idx:
                    step["status"] = "complete"
                elif step["name"] == mapped_name:
                    step["status"] = "running"
                else:
                    step["status"] = "pending"
        import asyncio
        asyncio.create_task(self._save_job_async(job))

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
        await self._save_job_async(job)
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
                        job_id=job.job_id,
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
                        job_id=job.job_id,
                    )

                job.result = result
                job.overall_pct = 100
                for step in job.agent_steps:
                    step["status"] = "complete"

                await session.commit()

                if job.send_report_email and job.triggering_user_id:
                    job.report_delivery_status = "pending"
                    try:
                        from app.services.report_delivery_service import send_project_report_email

                        async with factory() as email_session:
                            delivery = await send_project_report_email(
                                email_session,
                                job.project_id,
                                job.triggering_user_id,
                                job.job_id,
                                skip_rate_limit=True,
                            )
                        job.report_delivery_status = delivery.status
                        if delivery.error_message and delivery.status != "sent":
                            job.report_delivery_error = delivery.error_message
                        logger.info(
                            "Report email for job %s project %s: %s to %s",
                            job.job_id,
                            job.project_id,
                            delivery.status,
                            delivery.recipient_email,
                        )
                    except Exception as report_exc:
                        logger.exception(
                            "Report email failed for job %s", job.job_id
                        )
                        job.report_delivery_status = "failed"
                        job.report_delivery_error = str(report_exc)
                elif job.send_report_email:
                    job.report_delivery_status = "skipped"
                    job.report_delivery_error = (
                        "No user linked to this analyze job for report delivery."
                    )
                    logger.warning(
                        "Report email skipped for job %s: no triggering user",
                        job.job_id,
                    )
                else:
                    job.report_delivery_status = "skipped"

                job.status = "complete"
                await self._save_job_async(job)
        except Exception as exc:
            logger.exception("Analyze job %s failed", job.job_id)
            job.status = "error"
            job.error = str(exc)
            await self._save_job_async(job)
            try:
                from app.services.websocket_manager import manager
                import asyncio
                asyncio.create_task(manager.broadcast({
                    "type": "PIPELINE_ERROR",
                    "payload": {"error": str(exc)}
                }, "pipeline", str(job.project_id)))
            except Exception as b_exc:
                logger.error("Failed to broadcast PIPELINE_ERROR: %s", b_exc)

    def enqueue(
        self,
        job: AnalyzeJob,
        **kwargs: Any,
    ) -> None:
        asyncio.create_task(self.run_job(job, **kwargs))


analyze_job_service = AnalyzeJobService()
