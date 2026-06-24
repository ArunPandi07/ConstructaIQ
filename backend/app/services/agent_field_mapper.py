from typing import Any

AGENT_CONTRACT = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT = "PermitAgent"
AGENT_SUPPLIER = "SupplierAgent"

def normalize_contract_agent(data: dict[str, Any]) -> dict[str, Any]:
    return data

def normalize_blueprint_agent(data: dict[str, Any]) -> dict[str, Any]:
    return data

def normalize_permit_agent(data: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    result = dict(data)
    permits = result.get("required_permits", [])
    if isinstance(permits, list):
        coerced = []
        for p in permits:
            if isinstance(p, str):
                coerced.append({"name": p, "status": "required"})
            elif isinstance(p, dict):
                coerced.append(p)
        result["required_permits"] = coerced
    return result

def normalize_supplier_agent(data: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    result = dict(data)
    # Map 'material_orders' or 'selected_suppliers' to 'procurement_plan' so DB saves it
    if "procurement_plan" not in result:
        orders = result.get("material_orders") or result.get("selected_suppliers") or []
        if orders:
            result["procurement_plan"] = orders
    return result

def normalize_crew_agent(data: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    result = dict(data)
    # Map 'crew_plan' or 'team_assignments' to 'crew_allocations'
    if "crew_allocations" not in result:
        allocs = result.get("crew_plan") or result.get("team_assignments") or []
        if allocs:
            result["crew_allocations"] = allocs
    return result

def build_project_summary(
    contract_data: dict[str, Any],
    *,
    blueprint_data: dict[str, Any] | None = None,
    fallback_project_name: str = "",
) -> dict[str, Any]:
    summary = dict(contract_data)
    
    # Safely map custom schema keys to database canonical keys
    mapping = {
        "Projecttype": "project_type",
        "startdate": "start_date",
        "completiondate": "target_completion_date",
        "Milestones": "milestones"
    }
    
    for custom_key, canonical_key in mapping.items():
        if custom_key in summary and canonical_key not in summary:
            summary[canonical_key] = summary[custom_key]
            
    if "project_name" not in summary or not summary["project_name"]:
        summary["project_name"] = fallback_project_name
    return summary

def normalize_agent_output(agent_name: str, data: dict[str, Any]) -> dict[str, Any]:
    if agent_name == "PermitAgent":
        return normalize_permit_agent(data)
    elif agent_name == "SupplierAgent":
        return normalize_supplier_agent(data)
    elif agent_name == "CrewAgent":
        return normalize_crew_agent(data)
    return data
