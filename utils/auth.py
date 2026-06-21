import os
import jwt
import bcrypt
import json
import urllib.request
from datetime import datetime, timedelta
import anyio
from dotenv import load_dotenv

load_dotenv()

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "local_development_secret_key_1234567890")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# --- Password Hashing & Verification ---
def get_password_hash(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt.
    """
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed bcrypt password.
    """
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

# --- JWT Generation & Verification ---
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Generates a signed JWT token containing claims.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a signed JWT token.
    Returns the token payload if valid, otherwise None.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# --- Google OAuth2 Verification ---
def verify_oauth_google_token_sync(id_token: str) -> dict:
    """
    Synchronous helper to verify Google OAuth ID Tokens.
    Supports a mock token prefix ('mock-google-token-') for testing/sandboxing.
    """
    # Local sandboxed mock verification
    if id_token.startswith("mock-google-token-"):
        username = id_token.replace("mock-google-token-", "").strip()
        if not username:
            username = "testuser"
        return {
            "email": f"{username}@example.com",
            "name": username.capitalize(),
            "sub": f"google_{username}",
            "email_verified": True
        }
        
    # Real Google API call
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            if "error" in data or "error_description" in data:
                return None
            return data
    except Exception as e:
        print(f"OAuth token verification failed: {e}")
        return None

async def verify_oauth_google_token(id_token: str) -> dict:
    """
    Asynchronously executes token verification in a thread pool.
    """
    return await anyio.to_thread.run_sync(verify_oauth_google_token_sync, id_token)
