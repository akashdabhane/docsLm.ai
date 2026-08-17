import os
import shutil
import logging
from typing import Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure local upload directory exists
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)


class StorageService:
    @staticmethod
    async def upload_file(file_bytes: bytes, filename: str, subfolder: str) -> Tuple[str, str]:
        """
        Uploads a file and returns (storage_url, storage_key).
        Supports 'local' storage mode with fallbacks for Cloudinary / S3.
        """
        folder_path = os.path.join(settings.LOCAL_STORAGE_DIR, subfolder)
        os.makedirs(folder_path, exist_ok=True)
        
        file_key = os.path.join(subfolder, filename).replace("\\", "/")
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        # In local mode, return relative/absolute server file URL
        storage_url = f"/uploads/{file_key}"
        logger.info(f"File stored locally at: {file_path} (URL: {storage_url})")
        return storage_url, file_key


    @staticmethod
    def get_local_path(storage_key: str) -> str:
        """Helper to get full local file system path."""
        return os.path.join(settings.LOCAL_STORAGE_DIR, storage_key)


    @staticmethod
    async def delete_file(storage_key: str) -> bool:
        """Deletes file from local storage."""
        try:
            file_path = os.path.join(settings.LOCAL_STORAGE_DIR, storage_key)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            logger.error(f"Error deleting file {storage_key}: {e}")
        return False

