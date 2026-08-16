import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from bson import ObjectId
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    try:
        db_manager.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        # Create indexes
        await db_manager.db.users.create_index("email", unique=True)
        await db_manager.db.notebooks.create_index([("user_id", 1), ("created_at", -1)])
        await db_manager.db.documents.create_index([("notebook_id", 1), ("status", 1)])
        await db_manager.db.conversations.create_index([("notebook_id", 1), ("created_at", -1)])
        await db_manager.db.messages.create_index([("conversation_id", 1), ("created_at", 1)])
        await db_manager.db.studio_outputs.create_index([("notebook_id", 1), ("type", 1)])
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # Allow running even if MongoDB connection string fails during dev setup fallback
        db_manager.db = None

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_manager.db

def get_sync_db():
    client = MongoClient(settings.MONGODB_URL)
    return client[settings.MONGODB_DB_NAME]

def parse_object_id(id_str: str) -> ObjectId:
    if isinstance(id_str, ObjectId):
        return id_str
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid ObjectId format: {id_str}")

def serialize_doc(doc: dict) -> dict:
    """Helper to convert BSON ObjectId and datetimes to JSON strings."""
    if not doc:
        return doc
    res = {}
    for k, v in doc.items():
        if k == "_id":
            res["id"] = str(v)
            res["_id"] = str(v)
        elif isinstance(v, ObjectId):
            res[k] = str(v)
        elif hasattr(v, "isoformat"):
            res[k] = v.isoformat()
        elif isinstance(v, list):
            res[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
        elif isinstance(v, dict):
            res[k] = serialize_doc(v)
        else:
            res[k] = v
    return res
