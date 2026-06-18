from fastapi import APIRouter, Depends, HTTPException, status
from models.user import UserCreate, UserResponse, UserDB
from database import get_db
from bson import ObjectId

router = APIRouter()

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

@router.post("/user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db = Depends(get_db)):
    """
    Creates a new user profile.
    """
    # Create the user database model (includes created_at field generation)
    user_db = UserDB(**user_data.model_dump())
    
    try:
        result = await db.users.insert_one(user_db.model_dump(by_alias=True, exclude={"id"}))
        user_id = str(result.inserted_id)
        return UserResponse(user_id=user_id, message="User created successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )
