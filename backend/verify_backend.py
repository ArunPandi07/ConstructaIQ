import os
import json
import asyncio
from fastapi.testclient import TestClient

# Add app to python path dynamically if needed
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.main import app

def run_e2e_verification():
    print("=" * 60)
    print("CONSTRUCTAIQ BACKEND END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Create dummy files
    print("\n[Step 1] Creating temporary mock PDFs...")
    contract_file_path = "mock_contract.pdf"
    blueprint_file_path = "mock_blueprint.pdf"

    with open(contract_file_path, "wb") as f:
        f.write(b"%PDF-1.4 Mock Contract Content")
    with open(blueprint_file_path, "wb") as f:
        f.write(b"%PDF-1.4 Mock Blueprint Content")

    project_id = None
    try:
        # Wrap in TestClient context manager to trigger FastAPI startup lifespan (DB creation)
        with TestClient(app) as client:
            # 2. Upload files
            print("\n[Step 2] Testing: POST /api/projects/upload...")
            with open(contract_file_path, "rb") as f_contract, open(blueprint_file_path, "rb") as f_blueprint:
                files = {
                    "contract": (contract_file_path, f_contract, "application/pdf"),
                    "blueprint": (blueprint_file_path, f_blueprint, "application/pdf")
                }
                response = client.post("/api/projects/upload", files=files)
                
            if response.status_code == 201:
                project_data = response.json()
                project_id = project_data["id"]
                print(f"[OK] Success! Project created. ID: {project_id}")
                print(json.dumps(project_data, indent=2))
            else:
                print(f"[ERROR] Failed to upload. Code: {response.status_code}, Body: {response.text}")
                return

            # 3. Analyze project (Orchestration run)
            print(f"\n[Step 3] Testing: POST /api/projects/analyze/{project_id}...")
            response = client.post(f"/api/projects/analyze/{project_id}")
            if response.status_code == 200:
                analysis_data = response.json()
                print("[OK] Success! Orchestration complete.")
                print(json.dumps(analysis_data, indent=2))
            else:
                print(f"[ERROR] Failed orchestration. Code: {response.status_code}, Body: {response.text}")
                return

            # 4. Get Project Summary
            print(f"\n[Step 4] Testing: GET /api/projects/{project_id}/summary...")
            response = client.get(f"/api/projects/{project_id}/summary")
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))

            # 5. Get Project Risks
            print(f"\n[Step 5] Testing: GET /api/projects/{project_id}/risks...")
            response = client.get(f"/api/projects/{project_id}/risks")
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))

            # 6. Get Recovery Plan
            print(f"\n[Step 6] Testing: GET /api/projects/{project_id}/recovery...")
            response = client.get(f"/api/projects/{project_id}/recovery")
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))

            # 7. Get Project Health
            print(f"\n[Step 7] Testing: GET /api/projects/{project_id}/health...")
            response = client.get(f"/api/projects/{project_id}/health")
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))

            # 8. Get Agent Outputs
            print(f"\n[Step 8] Testing: GET /api/projects/{project_id}/agents...")
            response = client.get(f"/api/projects/{project_id}/agents")
            print(f"Status: {response.status_code}")
            print(f"Retrieved {len(response.json())} agent outputs.")

            # 9. Call Single Agent Directly
            print("\n[Step 9] Testing: POST /api/projects/call-agent...")
            payload = {
                "agent_name": "ContractAgent",
                "version": "1.0",
                "text": "Extracted text sample for ContractAgent run."
            }
            response = client.post("/api/projects/call-agent", json=payload)
            print(f"Status: {response.status_code}")
            print(json.dumps(response.json(), indent=2))

    finally:
        # Clean up temporary mock PDFs
        print("\nCleaning up temporary PDF files...")
        if os.path.exists(contract_file_path):
            try:
                os.remove(contract_file_path)
            except Exception as e:
                print(f"Error removing contract PDF: {e}")
        if os.path.exists(blueprint_file_path):
            try:
                os.remove(blueprint_file_path)
            except Exception as e:
                print(f"Error removing blueprint PDF: {e}")
                
        # Clean up database file to reset environment
        db_path = "constructaiq.db"
        if os.path.exists(db_path):
            import time
            time.sleep(1.0)  # wait for sqlite to release lock
            try:
                os.remove(db_path)
                print("Reset local SQLite database file.")
            except Exception as e:
                print(f"Error resetting local database: {e}")
        
        # Clean up mock storage directory if it exists
        mock_storage_dir = os.path.join(os.path.dirname(__file__), "mock_storage")
        if os.path.exists(mock_storage_dir):
            try:
                shutil = __import__("shutil")
                shutil.rmtree(mock_storage_dir)
                print("Cleaned up local mock storage.")
            except Exception as e:
                print(f"Error clearing mock storage directory: {e}")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_verification()
