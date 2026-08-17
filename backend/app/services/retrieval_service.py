import logging
import numpy as np
from typing import List, Dict, Any
from app.core.config import settings
from app.core.database import get_sync_db
from app.services.embedding_service import EmbeddingService
from pinecone import Pinecone


logger = logging.getLogger(__name__)

class RetrievalService:
    @staticmethod
    def upsert_chunks(notebook_id: str, chunks: List[Dict[str, Any]]) -> bool:
        """
        Upserts document chunks and embeddings into Pinecone index (under namespace notebook_{notebook_id}).
        Falls back to MongoDB vector cache if Pinecone API key is not configured.
        """
        if not chunks:
            return True

        texts = [c["text"] for c in chunks]
        vectors = EmbeddingService.get_embeddings(texts)

        # 1. Pinecone Vector Upsert
        if settings.PINECONE_API_KEY:
            try:
                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                index = pc.Index(settings.PINECONE_INDEX_NAME)
                
                pinecone_vectors = []
                for chunk, vec in zip(chunks, vectors):
                    pinecone_vectors.append({
                        "id": chunk["chunk_id"],
                        "values": vec,
                        "metadata": {
                            "document_id": chunk["document_id"],
                            "notebook_id": chunk["notebook_id"],
                            "filename": chunk["filename"],
                            "page_number": chunk["page_number"],
                            "section": chunk["section"],
                            "chunk_index": chunk["chunk_index"],
                            "text": chunk["text"]
                        }
                    })
                
                # Upsert in namespace notebook_<notebook_id>
                namespace = f"notebook_{notebook_id}"
                index.upsert(vectors=pinecone_vectors, namespace=namespace)
                logger.info(f"Successfully upserted {len(chunks)} vectors to Pinecone namespace {namespace}")
                return True
            except Exception as e:
                logger.warning(f"Pinecone upsert failed, using fallback vector store: {e}")

        # 2. MongoDB Fallback Vector Store
        db = get_sync_db()
        records = []
        for chunk, vec in zip(chunks, vectors):
            records.append({
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "notebook_id": chunk["notebook_id"],
                "filename": chunk["filename"],
                "page_number": chunk["page_number"],
                "section": chunk["section"],
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "vector": vec
            })
        
        if records:
            db.vector_chunks.delete_many({"document_id": chunks[0]["document_id"]})
            db.vector_chunks.insert_many(records)
            logger.info(f"Upserted {len(records)} chunks into MongoDB fallback vector store for notebook {notebook_id}")
        return True


    @staticmethod
    def query_notebook(notebook_id: str, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant document chunks for a question, restricted strictly to notebook_id.
        """
        query_vec = EmbeddingService.get_query_embedding(query)
        if not query_vec:
            return []

        # 1. Pinecone Vector Search
        if settings.PINECONE_API_KEY:
            try:
                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                index = pc.Index(settings.PINECONE_INDEX_NAME)
                namespace = f"notebook_{notebook_id}"
                
                res = index.query(
                    namespace=namespace,
                    vector=query_vec,
                    top_k=top_k,
                    include_metadata=True
                )
                
                matches = []
                for match in res.matches:
                    meta = match.metadata
                    matches.append({
                        "chunk_id": match.id,
                        "score": match.score,
                        "document_id": meta.get("document_id"),
                        "notebook_id": meta.get("notebook_id"),
                        "filename": meta.get("filename"),
                        "page_number": int(meta.get("page_number", 1)),
                        "section": meta.get("section", ""),
                        "text": meta.get("text", "")
                    })
                return matches
            except Exception as e:
                logger.warning(f"Pinecone query failed, falling back to local search: {e}")

        # 2. MongoDB Fallback Similarity Search
        db = get_sync_db()
        chunks = list(db.vector_chunks.find({"notebook_id": notebook_id}))
        if not chunks:
            return []

        q_vec = np.array(query_vec, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec) + 1e-9

        scored_chunks = []
        for c in chunks:
            c_vec = np.array(c["vector"], dtype=np.float32)
            c_norm = np.linalg.norm(c_vec) + 1e-9
            similarity = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            
            scored_chunks.append({
                "chunk_id": c["chunk_id"],
                "score": similarity,
                "document_id": c["document_id"],
                "notebook_id": c["notebook_id"],
                "filename": c["filename"],
                "page_number": c["page_number"],
                "section": c["section"],
                "text": c["text"]
            })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]


    @staticmethod
    def delete_document_vectors(notebook_id: str, document_id: str):
        """Deletes vectors for a document."""
        if settings.PINECONE_API_KEY:
            try:
                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                index = pc.Index(settings.PINECONE_INDEX_NAME)
                namespace = f"notebook_{notebook_id}"
                index.delete(filter={"document_id": document_id}, namespace=namespace)
            except Exception as e:
                logger.warning(f"Pinecone delete vectors failed: {e}")

        db = get_sync_db()
        db.vector_chunks.delete_many({"document_id": document_id})

