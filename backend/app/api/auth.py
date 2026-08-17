from datetime import datetime, timezone
from fastapi import APIRouter, Response, HTTPException, status, Depends
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_database, serialize_doc, parse_object_id
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserRegister):
    db = get_database()
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    hashed_pwd = get_password_hash(user_data.password)
    now = datetime.now(timezone.utc)
    
    new_user = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password_hash": hashed_pwd,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={user_data.name}",
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return serialize_doc(new_user)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, response: Response):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token(subject=str(user["_id"]))
    
    # Set HTTP-only cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAME_SITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    serialized_user = serialize_doc(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialized_user
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=settings.COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

