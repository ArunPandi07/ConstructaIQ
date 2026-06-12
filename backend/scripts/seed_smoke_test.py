"""Insert and query sample rows via repositories; verifies schema and CRUD."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.document_repository import DocumentRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.session import _get_session_factory
from app.schemas.agent_execution import AgentExecutionCreate
from app.schemas.document import DocumentCreate
from app.schemas.project import ProjectCreate


async def main() -> int:
    if not is_db_configured():
        print("DATABASE_URL is not configured.")
        return 1

    await init_db()
    session_factory = _get_session_factory()

    try:
        async with session_factory() as session:
            project_repo = ProjectRepository(session)
            document_repo = DocumentRepository(session)
            agent_repo = AgentExecutionRepository(session)

            project = await project_repo.create(
                ProjectCreate(project_name="Smoke Test Tower", status="active")
            )
            print(f"Created project id={project.project_id}")

            document = await document_repo.create(
                DocumentCreate(
                    project_id=project.project_id,
                    document_type="contract",
                    file_name="smoke_contract.pdf",
                )
            )
            print(f"Created document id={document.document_id}")

            execution = await agent_repo.create(
                AgentExecutionCreate(
                    project_id=project.project_id,
                    agent_name="ContractAgent",
                    agent_version="1",
                    status="complete",
                    output_json='{"smoke": true}',
                )
            )
            print(f"Created agent execution id={execution.execution_id}")

            await session.commit()

            loaded = await project_repo.get_by_id(project.project_id)
            docs = await document_repo.list_by_project(project.project_id)
            agents = await agent_repo.list_by_project_and_agent(
                project.project_id, "ContractAgent"
            )
            print(f"Loaded project: {loaded.project_name if loaded else None}")
            print(f"Documents for project: {len(docs)}")
            print(f"ContractAgent runs: {len(agents)}")

            await project_repo.delete(loaded)
            await session.commit()
            print("Deleted project (cascade removes children)")

            remaining_docs = await document_repo.list_by_project(project.project_id)
            print(f"Documents after cascade delete: {len(remaining_docs)}")

        print("Smoke test passed.")
        return 0
    except Exception as exc:
        print(f"Smoke test failed: {exc}")
        return 1
    finally:
        await dispose_db()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
