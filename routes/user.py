from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.user import UserCreate, UserResponse, UserDB, UserLogin, TokenResponse, OAuthLogin, UserGoal
from database import get_db
from bson import ObjectId
from utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    verify_oauth_google_token,
)

router = APIRouter()
security = HTTPBearer()

async def verify_user_exists(user_id: str, db) -> dict:
    """
    Helper function to verify if a user exists in the database.
    Raises 400 if user_id is not a valid ObjectId format.
    Raises 404 if user does not exist.
    """
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
        
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user_id format")
        
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return user

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> str:
    """
    FastAPI dependency to extract and validate the JWT Bearer token.
    Returns the user_id (str) if validation succeeds, otherwise raises 401.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID missing",
        )
        
    # Verify user exists in the database
    await verify_user_exists(user_id, db)
    return user_id

@router.post("/user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db = Depends(get_db)):
    """
    Registers a new user using email and password.
    """
    # 1. Check if email is already taken
    email_lower = user_data.email.strip().lower()
    existing_user = await db.users.find_one({"email": email_lower})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # 2. Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # 3. Create the database record
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict["email"] = email_lower
    user_dict["hashed_password"] = hashed_password
    
    user_db = UserDB(**user_dict)
    
    try:
        result = await db.users.insert_one(user_db.model_dump(by_alias=True, exclude={"id"}))
        user_id = str(result.inserted_id)
        return UserResponse(user_id=user_id, message="User created successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/user/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_user(login_data: UserLogin, db = Depends(get_db)):
    """
    Authenticates user credentials and returns a JWT access token.
    """
    email_lower = login_data.email.strip().lower()
    user = await db.users.find_one({"email": email_lower})
    
    if not user or not user.get("hashed_password") or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    # Create JWT access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return TokenResponse(
        access_token=access_token,
        user_id=str(user["_id"]),
        is_new_user=False
    )

@router.post("/user/oauth-login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def oauth_login_user(oauth_data: OAuthLogin, db = Depends(get_db)):
    """
    Authenticates a user via Google OAuth token.
    Auto-registers the user if their profile does not exist.
    """
    if oauth_data.provider.lower() != "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported OAuth provider. Only 'google' is supported."
        )
        
    # 1. Verify Google ID token
    payload = await verify_oauth_google_token(oauth_data.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth token verification failed"
        )
        
    oauth_id = payload["sub"]
    email = payload["email"].strip().lower()
    
    # 2. Search database by OAuth ID or email
    user = await db.users.find_one({"$or": [{"oauth_id": oauth_id}, {"email": email}]})
    is_new_user = False
    
    if not user:
        # 3. Auto-register user with provided credentials or default values
        is_new_user = True
        name = oauth_data.name or payload.get("name") or email.split("@")[0]
        age = oauth_data.age or 25
        weight_kg = oauth_data.weight_kg or 70.0
        height_cm = oauth_data.height_cm or 170.0
        goal = oauth_data.goal or UserGoal.maintain
        
        new_user = {
            "email": email,
            "oauth_provider": "google",
            "oauth_id": oauth_id,
            "name": name,
            "age": age,
            "weight_kg": weight_kg,
            "height_cm": height_cm,
            "goal": goal.value,
            "created_at": datetime.utcnow()
        }
        
        try:
            result = await db.users.insert_one(new_user)
            user = await db.users.find_one({"_id": result.inserted_id})
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to auto-register OAuth user: {str(e)}"
            )
    else:
        # Link Google OAuth ID if logging in with email first
        if not user.get("oauth_id"):
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"oauth_id": oauth_id, "oauth_provider": "google"}}
            )
            
    # 4. Generate JWT access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return TokenResponse(
        access_token=access_token,
        user_id=str(user["_id"]),
        is_new_user=is_new_user
    )
