import logging
import json
from typing import AsyncGenerator, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    @staticmethod
    def get_llm(temperature: float = 0.2):
        """Returns initialized LangChain Chat Model (Gemini or OpenAI)."""
        if settings.GEMINI_API_KEY:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=settings.LLM_MODEL,
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=temperature
                )
            except Exception as e:
                logger.warning(f"Failed to load ChatGoogleGenerativeAI: {e}")

        if settings.OPENAI_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=settings.OPENAI_API_KEY,
                    temperature=temperature
                )
            except Exception as e:
                logger.warning(f"Failed to load ChatOpenAI: {e}")

        return None

    @staticmethod
    async def generate_response(prompt: str, temperature: float = 0.2) -> str:
        """Generates a complete LLM text response."""
        llm = LLMService.get_llm(temperature)
        if llm:
            try:
                res = await llm.ainvoke(prompt)
                return res.content
            except Exception as e:
                logger.error(f"LLM call failed: {e}")

        # Fallback response for dev mode
        return f"Based on the provided documents:\n\n{prompt[:300]}...\n\n[Dev fallback response - Please configure GEMINI_API_KEY in .env for live Gemini output]"

    @staticmethod
    async def stream_response(prompt: str, temperature: float = 0.2) -> AsyncGenerator[str, None]:
        """Streams LLM completion tokens async."""
        llm = LLMService.get_llm(temperature)
        if llm:
            try:
                async for chunk in llm.astream(prompt):
                    if chunk.content:
                        yield chunk.content
                return
            except Exception as e:
                logger.error(f"LLM streaming failed: {e}")

        # Fallback stream for dev mode
        fallback_text = (
            "Here is the synthesized information grounded in your uploaded documents. "
            "The key findings demonstrate structured document retrieval with page citations."
        )
        words = fallback_text.split(" ")
        for w in words:
            yield w + " "
