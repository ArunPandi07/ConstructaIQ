import json
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.logging_service import get_logger
from app.services.foundry_service import foundry_service

class CallAgentRequest(BaseModel):
    agent_name: str
    version: str = "1"
    text: str

logger = get_logger("ProjectsRouter")
router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/call-agent")
async def call_single_agent(request: CallAgentRequest):
    """
    Directly invokes a specific Azure AI Foundry agent by name and version
    with the provided input text.
    """
    logger.info(f"Direct agent call: agent_name={request.agent_name}, version={request.version}")
    try:
        response = await foundry_service.call_agent_directly(
            text=request.text,
            agent_name=request.agent_name,
            version=request.version,
        )

        # Try to return as parsed JSON, else return raw string
        try:
            parsed_json = json.loads(response)
            return {
                "agent_name": request.agent_name,
                "version": request.version,
                "output": parsed_json,
            }
        except Exception:
            return {
                "agent_name": request.agent_name,
                "version": request.version,
                "output": response,
            }

    except Exception as e:
        logger.error(f"Failed direct agent execution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute agent: {str(e)}",
        )
