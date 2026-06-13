import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.orchestrator import analyze_orchestrator as orchestrator


@pytest.mark.asyncio
async def test_text_pipeline_runs_contract_then_blueprint_sequentially():
    active_agents: set[str] = set()
    overlaps: list[tuple[str, set[str]]] = []
    call_order: list[str] = []

    async def fake_call(agent_name, *_args, **_kwargs):
        if active_agents:
            overlaps.append((agent_name, set(active_agents)))
        active_agents.add(agent_name)
        call_order.append(agent_name)
        await asyncio.sleep(0.01)
        active_agents.remove(agent_name)
        if agent_name == orchestrator.AGENT_CONTRACT:
            return {"project_name": "Tower"}
        return {}

    with patch.object(orchestrator, "_call", side_effect=fake_call), patch.object(
        orchestrator,
        "_run_downstream_agents",
        new_callable=AsyncMock,
        return_value={"ok": True},
    ) as downstream:
        result = await orchestrator.run_pipeline_from_text(
            project_name="Tower",
            description="A test construction project",
        )

    assert result == {"ok": True}
    assert call_order == [
        orchestrator.AGENT_CONTRACT,
        orchestrator.AGENT_BLUEPRINT,
    ]
    assert overlaps == []
    downstream.assert_awaited_once()


@pytest.mark.asyncio
async def test_downstream_pipeline_runs_supplier_then_crew_sequentially():
    active_agents: set[str] = set()
    overlaps: list[tuple[str, set[str]]] = []
    call_order: list[str] = []

    async def fake_call(agent_name, *_args, **_kwargs):
        if active_agents:
            overlaps.append((agent_name, set(active_agents)))
        active_agents.add(agent_name)
        call_order.append(agent_name)
        await asyncio.sleep(0.01)
        active_agents.remove(agent_name)
        if agent_name == orchestrator.AGENT_PLANNING:
            return {"project_phases": [], "estimated_duration_days": 0}
        if agent_name == orchestrator.AGENT_SUPPLIER:
            return {
                "procurement_plan": [
                    {
                        "material_name": "Steel",
                        "supplier_name": "SteelCo",
                        "quantity": 1,
                        "unit_price": 100,
                        "delivery_date": "2026-01-01",
                        "total_cost": 100,
                    },
                ],
            }
        if agent_name == orchestrator.AGENT_CREW:
            return {"crew_allocations": []}
        return {}

    with patch.object(orchestrator, "_call", side_effect=fake_call), patch.object(
        orchestrator,
        "load_catalogs",
        new_callable=AsyncMock,
        return_value=([], []),
    ):
        result = await orchestrator._run_downstream_agents(
            project_name="Tower",
            contract_data={"project_name": "Tower"},
            blueprint_data={},
        )

    assert len(result["supplierAnalysis"]["procurement_plan"]) == 1
    assert result["crewAnalysis"] == {"crew_allocations": []}
    assert call_order == [
        orchestrator.AGENT_PERMIT,
        orchestrator.AGENT_PLANNING,
        orchestrator.AGENT_SUPPLIER,
        orchestrator.AGENT_CREW,
    ]
    assert overlaps == []
