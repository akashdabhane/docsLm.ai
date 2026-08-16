import json
import logging
from typing import Dict, Any, List
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

async def generate_slide_deck_json(notebook_id: str) -> Dict[str, Any]:
    """
    Retrieves document content for notebook and generates a structured presentation slide deck.
    """
    chunks = RetrievalService.query_notebook(
        notebook_id=notebook_id,
        query="overview main findings architecture key points summary",
        top_k=10
    )
    
    if not chunks:
        return {
            "title": "Document Overview Presentation",
            "subtitle": "Generated from Workspace Knowledge Base",
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Welcome to Your Document Workspace",
                    "content": [
                        "Upload PDF or Word documents to generate customized slide decks.",
                        "AI extracts core themes and structures presentation content automatically.",
                        "Includes speaker notes and key takeaway bullets."
                    ],
                    "speaker_notes": "Welcome the audience and introduce the document repository topics."
                }
            ]
        }

    combined_text = "\n".join([c["text"] for c in chunks[:6]])

    prompt = (
        "You are an expert presentation designer and executive summary author. "
        "Analyze the following document text and construct a 5 to 7 slide presentation deck. "
        "Format the output strictly as a valid JSON object matching this schema:\n\n"
        "{\n"
        '  "title": "Presentation Title",\n'
        '  "subtitle": "Executive Subtitle Summary",\n'
        '  "slides": [\n'
        "    {\n"
        '      "slide_number": 1,\n'
        '      "title": "Slide Title",\n'
        '      "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],\n'
        '      "speaker_notes": "Speaker notes for presenting this slide."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Do not wrap in markdown code blocks. Output ONLY valid JSON.\n\n"
        f"DOCUMENT SOURCE CONTENT:\n{combined_text[:3000]}\n\n"
        "SLIDE DECK JSON:"
    )

    response_text = await LLMService.generate_response(prompt, temperature=0.2)
    cleaned = response_text.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(cleaned)
        if "title" in data and "slides" in data:
            return data
    except Exception as e:
        logger.warning(f"Failed to parse slide deck JSON: {e}")

    return {
        "title": "Key Document Findings & Insights",
        "subtitle": "Automated Presentation Deck",
        "slides": [
            {
                "slide_number": 1,
                "title": "Executive Overview",
                "content": [
                    "Synthesized from uploaded workspace documents.",
                    "Structure-aware parsing preserves key headers and sections.",
                    "Provides grounded reference material for study and presentation."
                ],
                "speaker_notes": "Introduce the main objectives of this presentation."
            },
            {
                "slide_number": 2,
                "title": "Core Methodology & Architecture",
                "content": [
                    "Vector index chunking with page-level citations.",
                    "LangGraph orchestration for deterministic RAG retrieval.",
                    "Extensible studio outputs for mind maps, podcasts, and quizzes."
                ],
                "speaker_notes": "Walk through the architectural features."
            }
        ]
    }
