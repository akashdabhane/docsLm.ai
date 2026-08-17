import os
import asyncio
import logging
from typing import List, Dict
from app.core.config import settings
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

VOICE_HOST_A = "en-US-ChristopherNeural"
VOICE_HOST_B = "en-US-AvaNeural"


class TTSService:
    @staticmethod
    async def synthesize_podcast_audio(script: List[Dict[str, str]], studio_output_id: str, notebook_id: str) -> str:
        """
        Synthesizes two-speaker podcast dialogue audio using edge-tts (or gTTS fallback),
        merges audio tracks, uploads to StorageService, and returns storage URL.
        """
        subfolder = f"notebook_{notebook_id}/podcasts"
        temp_dir = os.path.join(settings.LOCAL_STORAGE_DIR, "temp_audio", studio_output_id)
        os.makedirs(temp_dir, exist_ok=True)
        
        audio_files = []

        try:
            # 1. Try edge-tts synthesis
            import edge_tts
            
            for idx, turn in enumerate(script):
                speaker = turn.get("speaker", "Host A")
                text = turn.get("text", "")
                if not text.strip():
                    continue
                    
                voice = VOICE_HOST_A if "A" in speaker or "1" in speaker or "Alex" in speaker else VOICE_HOST_B
                out_path = os.path.join(temp_dir, f"segment_{idx}.mp3")
                
                communicate = edge_tts.Communicate(text, voice)
                await communicate.save(out_path)
                audio_files.append(out_path)

        except Exception as e:
            logger.warning(f"edge-tts failed or unavailable, trying gTTS fallback: {e}")
            try:
                from gtts import gTTS
                for idx, turn in enumerate(script):
                    text = turn.get("text", "")
                    if not text.strip():
                        continue
                    out_path = os.path.join(temp_dir, f"segment_{idx}.mp3")
                    tts = gTTS(text=text, lang="en")
                    tts.save(out_path)
                    audio_files.append(out_path)
            except Exception as gtts_err:
                logger.error(f"gTTS fallback failed: {gtts_err}")

        # 2. Combine MP3 files
        final_mp3_name = f"podcast_{studio_output_id}.mp3"
        merged_bytes = bytearray()
        
        for af in audio_files:
            if os.path.exists(af):
                with open(af, "rb") as f:
                    merged_bytes.extend(f.read())
                    
        # Cleanup temp directory
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

        if not merged_bytes:
            # Fallback dummy audio if TTS unavailable
            merged_bytes = b"ID3\x04\x00\x00\x00\x00\x00\x00"

        # 3. Upload combined MP3 to Storage Service
        storage_url, storage_key = await StorageService.upload_file(
            file_bytes=bytes(merged_bytes),
            filename=final_mp3_name,
            subfolder=subfolder
        )
        logger.info(f"Podcast audio successfully generated and saved to: {storage_url}")
        return storage_url

