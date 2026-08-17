from fastapi import Request, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from bson import ObjectId

from app.core.config import settings
from app.core.security import decode_access_token
from app.core.database import get_database, parse_object_id, serialize_doc

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> dict:
    # 1. Try to get token from Cookie
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    auth_token = cookie_token or token
    
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = decode_access_token(auth_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return serialize_doc(user)
