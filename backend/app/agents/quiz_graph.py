import json
import logging
from typing import Dict, Any, List
from app.services.retrieval_service import RetrievalService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

async def generate_quiz_json(notebook_id: str) -> Dict[str, Any]:
    """
    Retrieves document content for notebook and generates a multiple-choice quiz with explanations.
    """
    chunks = RetrievalService.query_notebook(
        notebook_id=notebook_id,
        query="key concepts definitions rules methodologies facts",
        top_k=10
    )
    
    if not chunks:
        return {
            "title": "Document Knowledge Quiz",
            "questions": [
                {
                    "id": 1,
                    "question": "What is the primary function of the Knowledge Base in this application?",
                    "options": [
                        "Index uploaded documents for grounded AI search and Studio features",
                        "Search external websites and YouTube videos",
                        "Generate synthetic ungrounded text",
                        "Host live video streams"
                    ],
                    "correct_option_index": 0,
                    "explanation": "This platform is DOCUMENT-ONLY and indexes uploaded files for grounded AI chat and Studio outputs."
                }
            ]
        }

    combined_text = "\n".join([c["text"] for c in chunks[:6]])

    prompt = (
        "You are an educational assessment expert. Analyze the following document text and construct a "
        "5-question multiple-choice quiz to test reader comprehension.\n"
        "Format the output strictly as a valid JSON object matching this schema:\n\n"
        "{\n"
        '  "title": "Document Knowledge Assessment Quiz",\n'
        '  "questions": [\n'
        "    {\n"
        '      "id": 1,\n'
        '      "question": "Clear, specific question tested in text?",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correct_option_index": 0,\n'
        '      "explanation": "Detailed explanation of why Option A is correct based on text."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Do not wrap in markdown code blocks. Output ONLY valid JSON.\n\n"
        f"DOCUMENT SOURCE CONTENT:\n{combined_text[:3000]}\n\n"
        "QUIZ JSON:"
    )

    response_text = await LLMService.generate_response(prompt, temperature=0.3)
    cleaned = response_text.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(cleaned)
        if "questions" in data and isinstance(data["questions"], list):
            return data
    except Exception as e:
        logger.warning(f"Failed to parse quiz JSON: {e}")

    return {
        "title": "Document Concepts Quiz",
        "questions": [
            {
                "id": 1,
                "question": "How are document vectors isolated per notebook in Pinecone?",
                "options": [
                    "Using notebook_id namespace prefix notebook_{notebook_id}",
                    "All documents share a single unpartitioned vector table",
                    "By creating separate vector databases for every file",
                    "Using client-side localStorage filtering"
                ],
                "correct_option_index": 0,
                "explanation": "Tenant isolation is enforced in Pinecone using namespace notebook_{notebook_id} so vectors can never leak across notebooks."
            },
            {
                "id": 2,
                "question": "Which framework orchestrates deterministic RAG and retrieval retry loops?",
                "options": [
                    "LangGraph",
                    "Kafka",
                    "Kubernetes",
                    "Airflow"
                ],
                "correct_option_index": 0,
                "explanation": "LangGraph state machine graph coordinates query analysis, retrieval evaluation, query rewriting, and citation checking."
            }
        ]
    }
