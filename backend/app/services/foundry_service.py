import asyncio
import httpx
from typing import Optional

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("FoundryService")

MAX_RATE_LIMIT_RETRIES = 3
RATE_LIMIT_BASE_WAIT_SEC = 5


from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from pydantic import SecretStr

class FoundryService:
    def __init__(self):
        self.base_url = settings.LLM_BASE_URL
        self.model_name = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY

        if self.base_url:
            logger.info(f"FoundryService initialized with OpenAI-compatible endpoint: {self.base_url}")
            self.llm = ChatOpenAI(
                model=self.model_name,
                api_key=SecretStr(self.api_key) if self.api_key else SecretStr("empty"),
                base_url=self.base_url,
                max_retries=MAX_RATE_LIMIT_RETRIES,
                timeout=120.0,
            )
        else:
            logger.warning("LLM_BASE_URL not set. Calls will fail.")
            self.llm = None

    async def call_agent_directly(self, text: str, agent_name: str, version: str) -> str:
        """
        Calls the LLM using the OpenAI-compatible endpoint.
        """
        if not self.llm:
            raise ValueError("LLM endpoint is not configured.")

        logger.info(f"Calling LLM for agent='{agent_name}' v{version}")
        
        messages = [HumanMessage(content=text)]
        
        try:
            response = await self.llm.ainvoke(messages)
            if response and response.content:
                logger.info(f"Response received from agent '{agent_name}'.")
                return str(response.content)
            raise ValueError(f"Agent call failed for '{agent_name}'. Empty response.")
        except Exception as e:
            logger.error(f"Error calling LLM for {agent_name}: {e}")
            raise ValueError(f"Agent call failed: {e}")

    async def call_llm(self, prompt: str, agent_name: str, version: str = "1") -> str:
        """
        Alias for call_agent_directly — used by analyze_orchestrator.
        """
        return await self.call_agent_directly(
            text=prompt, agent_name=agent_name, version=version
        )


foundry_service = FoundryService()
