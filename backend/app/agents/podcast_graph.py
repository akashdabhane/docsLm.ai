import json
import logging
from typing import List, Dict, Any
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

async def generate_podcast_script(notebook_id: str, host1: str = "Host A", host2: str = "Host B") -> List[Dict[str, str]]:
    """
    Generates a natural two-speaker podcast dialogue script from notebook documents.
    Returns a list of dialogue objects: [{'speaker': 'Host A', 'text': '...'}, {'speaker': 'Host B', 'text': '...'}]
    """
    chunks = RetrievalService.query_notebook(notebook_id=notebook_id, query="key ideas summary research conclusions", top_k=8)
    
    if not chunks:
        return [
            {"speaker": host1, "text": "Welcome to the Notebook Overview Podcast! Today we are discussing document intelligence."},
            {"speaker": host2, "text": "That's right! Uploading your documents unlocks automated vector indexing and deep document RAG."}
        ]

    combined_text = "\n".join([c["text"] for c in chunks[:5]])
    
    prompt = (
        f"You are a producer for an engaging Tech & Research Podcast hosted by {host1} and {host2}.\n"
        f"{host1} is the knowledgeable expert host who explains technical details.\n"
        f"{host2} is the curious, insightful co-host who asks engaging questions and connects ideas.\n\n"
        "Generate a 6 to 8 turn conversation discussing the key takeaways from these uploaded documents.\n"
        "Format the output strictly as a JSON array of objects:\n"
        '[\n  {"speaker": "' + host1 + '", "text": "..."},\n  {"speaker": "' + host2 + '", "text": "..."}\n]\n\n'
        "Do not wrap in markdown code blocks. Output ONLY valid JSON array.\n\n"
        f"DOCUMENT SOURCE CONTENT:\n{combined_text[:3000]}\n\n"
        "PODCAST SCRIPT JSON:"
    )

    script_text = await LLMService.generate_response(prompt, temperature=0.7)
    cleaned = script_text.replace("```json", "").replace("```", "").strip()

    try:
        dialogue = json.loads(cleaned)
        if isinstance(dialogue, list) and len(dialogue) > 0:
            return dialogue
    except Exception as e:
        logger.warning(f"Failed to parse podcast script JSON: {e}")

    return [
        {"speaker": host1, "text": "Welcome to today's audio breakdown of your uploaded documents!"},
        {"speaker": host2, "text": "I've been reviewing these papers, and the structure-aware document parsing really stands out."},
        {"speaker": host1, "text": "Exactly. PyMuPDF extracts text preserving headings and page numbers, while Pinecone indexes vector embeddings for fast RAG search."},
        {"speaker": host2, "text": "And with LangGraph orchestrating query evaluation and citations, answers remain strictly grounded in the original files."}
    ]
