import asyncio
import httpx
from typing import Optional

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("FoundryService")

MAX_RATE_LIMIT_RETRIES = 3
RATE_LIMIT_BASE_WAIT_SEC = 5


def _parse_foundry_response(res_json: dict) -> Optional[str]:
    """Extract text from Azure AI Foundry or OpenAI response formats."""
    # Azure AI Foundry format: output[].content[].text
    if "output" in res_json:
        for out_item in res_json["output"]:
            if out_item.get("type") == "message":
                for content_item in out_item.get("content", []):
                    if content_item.get("type") == "output_text":
                        return content_item["text"]
    # Standard OpenAI format: choices[].message.content
    if "choices" in res_json and len(res_json["choices"]) > 0:
        return res_json["choices"][0].get("message", {}).get("content", "")
    return None


class FoundryService:
    def __init__(self):
        self.endpoint = settings.AZURE_AIFOUNDRY_ENDPOINT
        self.key = settings.AZURE_AIFOUNDRY_KEY

        if self.endpoint and self.key:
            logger.info("FoundryService initialized with Azure AI Foundry REST endpoint.")
        else:
            logger.warning("AZURE_AIFOUNDRY_ENDPOINT or AZURE_AIFOUNDRY_KEY not set. Calls will fail.")

    def _build_payload(self, text: str, agent_name: str, version: str) -> dict:
        return {
            "input": [{"role": "user", "content": text}],
            "agent_reference": {
                "name": agent_name,
                "version": version,
                "type": "agent_reference",
            },
        }

    def _build_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }

    def _get_endpoint_url(self) -> str:
        url = self.endpoint.rstrip("/")
        if not url.endswith("/openai/v1/responses"):
            url = f"{url}/openai/v1/responses"
        return url

    async def call_agent_directly(self, text: str, agent_name: str, version: str) -> str:
        """
        Calls a specific Azure AI Foundry agent by name and version.
        """
        if not self.endpoint or not self.key:
            raise ValueError("Azure AI Foundry endpoint and key are required.")

        endpoint_url = self._get_endpoint_url()
        payload = self._build_payload(text, agent_name, version)
        headers = self._build_headers()

        logger.info(f"POST {endpoint_url} -> agent='{agent_name}' v{version}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
                response = await client.post(endpoint_url, json=payload, headers=headers)
                if response.status_code == 200:
                    res_json = response.json()
                    text_out = _parse_foundry_response(res_json)
                    if text_out is not None:
                        logger.info(f"Response received from agent '{agent_name}'.")
                        return text_out
                    raise ValueError(
                        f"Unexpected response format. Keys: {list(res_json.keys())}"
                    )

                if response.status_code == 429 and attempt < MAX_RATE_LIMIT_RETRIES:
                    wait_sec = RATE_LIMIT_BASE_WAIT_SEC * (attempt + 1)
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            wait_sec = max(wait_sec, int(float(retry_after)))
                        except (TypeError, ValueError):
                            pass
                    logger.warning(
                        "Rate limit for agent '%s' v%s — retry %d/%d in %ds",
                        agent_name,
                        version,
                        attempt + 1,
                        MAX_RATE_LIMIT_RETRIES,
                        wait_sec,
                    )
                    await asyncio.sleep(wait_sec)
                    continue

                raise ValueError(
                    f"Agent call failed [{response.status_code}]: {response.text}"
                )

        raise ValueError(f"Agent call failed for '{agent_name}' after retries.")

    async def call_llm(self, prompt: str, agent_name: str, version: str = "1") -> str:
        """
        Alias for call_agent_directly — used by analyze_orchestrator.
        """
        return await self.call_agent_directly(
            text=prompt, agent_name=agent_name, version=version
        )


foundry_service = FoundryService()
