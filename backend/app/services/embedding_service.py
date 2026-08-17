import logging
import hashlib
from typing import List
from app.core.config import settings
from langchain_ollama import OllamaEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings


logger = logging.getLogger(__name__)

class EmbeddingService:
    @staticmethod
    def get_embeddings(texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a list of text strings.
        Supports local Ollama embeddings (with Gemini commented out) and fallback generator.
        """
        if not texts:
            return []

        # 1. Local Ollama Embeddings
        try:
            embeddings = OllamaEmbeddings(
                model=settings.OLLAMA_MODEL,
                base_url=settings.OLLAMA_BASE_URL
            )
            return embeddings.embed_documents(texts)
        except Exception as e:
            logger.warning(f"Ollama embedding call failed, falling back: {e}")

        # 2. Gemini Embeddings (COMMENTED OUT AS REQUESTED)
        # if settings.GEMINI_API_KEY:
        #     try:
        #         embeddings = GoogleGenerativeAIEmbeddings(
        #             model="models/text-embedding-004",
        #             google_api_key=settings.GEMINI_API_KEY
        #         )
        #         return embeddings.embed_documents(texts)
        #     except Exception as e:
        #         logger.warning(f"Gemini embedding call failed, falling back: {e}")

        # 3. OpenAI Embeddings
        # if settings.OPENAI_API_KEY:
        #     try:
        #         embeddings = OpenAIEmbeddings(
        #             model="text-embedding-3-small",
        #             api_key=settings.OPENAI_API_KEY
        #         )
        #         return embeddings.embed_documents(texts)
        #     except Exception as e:
        #         logger.warning(f"OpenAI embedding call failed, falling back: {e}")

        # 4. Local/Offline Deterministic Fallback Vector (768 dimensions)
        logger.info(f"Generating fallback deterministic embeddings for {len(texts)} chunks.")
        result = []
        for text in texts:
            vector = []
            for i in range(768):
                h = hashlib.sha256(f"{text}_{i}".encode("utf-8")).hexdigest()
                val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
                vector.append(val)
            result.append(vector)
        return result


    @staticmethod
    def get_query_embedding(query: str) -> List[float]:
        res = EmbeddingService.get_embeddings([query])
        return res[0] if res else []

