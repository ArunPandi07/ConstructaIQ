from collections.abc import AsyncGenerator

from pydantic import SecretStr

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("LLMService")

MAX_RATE_LIMIT_RETRIES = 3
DEFAULT_LLM_MODEL = "google/gemma-4-26b-a4b-it"


class LLMService:
    def __init__(self):
        self.llm_base_url = settings.LLM_BASE_URL
        self.llm_model = settings.LLM_MODEL
        self.llm_api_key = settings.LLM_API_KEY or "empty"
        self.llm_max_tokens = settings.LLM_MAX_TOKENS
        self.llm_temperature = settings.LLM_TEMPERATURE
        self._openai_llm = None

        if self.llm_base_url:
            logger.info(
                "LLMService using OpenAI-compatible endpoint: %s",
                self.llm_base_url,
            )
            self._init_openai_llm()
        else:
            logger.warning("LLM_BASE_URL not set. Agent calls will fail.")

    def _build_client(self, model: str):
        try:
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=model,
                api_key=SecretStr(self.llm_api_key),
                base_url=self.llm_base_url,
                max_tokens=self.llm_max_tokens,
                temperature=self.llm_temperature,
                max_retries=MAX_RATE_LIMIT_RETRIES,
                timeout=120.0,
                streaming=True,
            )
        except ImportError:
            return None

    def _init_openai_llm(self) -> None:
        client = self._build_client(self.llm_model or DEFAULT_LLM_MODEL)
        if client is None:
            logger.warning("langchain-openai not installed; LLM calls unavailable.")
        self._openai_llm = client

    async def call_agent_directly(
        self,
        text: str,
        agent_name: str,
        version: str,
    ) -> tuple[str, dict]:
        """Call the configured OpenAI-compatible LLM for an agent prompt."""
        if not self.llm_base_url:
            raise ValueError("LLM not configured. Set LLM_BASE_URL.")
        return await self._call_openai_compatible(text, agent_name, version)

    async def _call_openai_compatible(
        self,
        text: str,
        agent_name: str,
        version: str,
    ) -> tuple[str, dict]:
        llm = self._openai_llm
        if not llm:
            self._init_openai_llm()
            llm = self._openai_llm
        if not llm:
            raise ValueError("OpenAI-compatible LLM endpoint is not configured.")

        from langchain_core.messages import HumanMessage

        logger.info(
            "Calling LLM for agent='%s' v%s (model=%s)",
            agent_name,
            version,
            self.llm_model or DEFAULT_LLM_MODEL,
        )
        response = await llm.ainvoke([HumanMessage(content=text)])
        if response and response.content:
            logger.info("Response received from agent '%s'.", agent_name)
            token_usage = response.response_metadata.get("token_usage", {})
            return str(response.content), token_usage
        raise ValueError(f"Agent call failed for '{agent_name}'. Empty response.")

    async def call_llm(self, prompt: str, agent_name: str, version: str = "1") -> str:
        content, _ = await self.call_agent_directly(
            text=prompt, agent_name=agent_name, version=version
        )
        return content

    async def astream_messages(self, messages: list) -> AsyncGenerator[str, None]:
        """Stream LLM response tokens for a list of LangChain messages."""
        if not self.llm_base_url:
            raise ValueError("LLM not configured. Set LLM_BASE_URL.")

        llm = self._openai_llm
        if not llm:
            self._init_openai_llm()
            llm = self._openai_llm
        if not llm:
            raise ValueError("OpenAI-compatible LLM endpoint is not configured.")

        async for chunk in llm.astream(messages):
            if chunk.content:
                yield str(chunk.content)


llm_service = LLMService()
