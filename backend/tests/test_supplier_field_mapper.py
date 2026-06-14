from app.services.agent_field_mapper import normalize_supplier_agent


def test_normalize_supplier_agent_maps_procurement_aliases():
    raw = {
        "procurement_plan": [
            {
                "MaterialName": "Structural Steel",
                "SupplierName": "SteelCo",
                "Quantity": 100,
                "UnitPrice": 5000,
                "TotalCost": 500000,
            }
        ]
    }
    result = normalize_supplier_agent(raw)
    row = result["procurement_plan"][0]
    assert row["material_name"] == "Structural Steel"
    assert row["supplier_name"] == "SteelCo"
    assert row["quantity"] == 100
