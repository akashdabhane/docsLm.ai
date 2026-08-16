import asyncio
import logging
from datetime import datetime, timezone
from app.core.database import get_sync_db, parse_object_id
from app.agents.podcast_graph import generate_podcast_script
from app.services.tts_service import TTSService

logger = logging.getLogger(__name__)

def process_podcast_task(studio_output_id: str, notebook_id: str, host1_name: str, host2_name: str):
    """
    Background worker task for generating AI podcast script & synthesizing two-speaker MP3 audio.
    """
    db = get_sync_db()
    studio_oid = parse_object_id(studio_output_id)
    
    try:
        logger.info(f"Starting async Podcast audio generation for studio output {studio_output_id}")
        
        db.studio_outputs.update_one(
            {"_id": studio_oid},
            {"$set": {"status": "PROCESSING", "updated_at": datetime.now(timezone.utc)}}
        )
        
        # 1. Generate Podcast Script
        script = asyncio.run(generate_podcast_script(
            notebook_id=notebook_id,
            host1=host1_name,
            host2=host2_name
        ))
        
        # 2. Synthesize Audio & Merge MP3s
        audio_url = asyncio.run(TTSService.synthesize_podcast_audio(
            script=script,
            studio_output_id=studio_output_id,
            notebook_id=notebook_id
        ))
        
        # 3. Update Studio Output record in MongoDB
        db.studio_outputs.update_one(
            {"_id": studio_oid},
            {"$set": {
                "status": "COMPLETED",
                "output": {"script": script, "audio_url": audio_url},
                "storage_url": audio_url,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"Podcast audio studio output {studio_output_id} COMPLETED!")
        return True

    except Exception as e:
        logger.error(f"Error generating podcast studio output {studio_output_id}: {e}", exc_info=True)
        db.studio_outputs.update_one(
            {"_id": studio_oid},
            {"$set": {
                "status": "FAILED",
                "output": {"error": str(e)},
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return False
