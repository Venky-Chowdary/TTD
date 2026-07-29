import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Annotated, Any, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "ttd-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_user_id(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=4)


class LoginRequest(BaseModel):
    username: str
    password: str


class Pilgrim(BaseModel):
    name: str
    age: str
    gender: str
    mobile: str
    idType: str
    idNumber: str
    relation: str = "Self"
    note: str = ""
    docUrl: Optional[str] = None


class BookingEvent(BaseModel):
    title: str
    datetime: str
    url: str
    note: str = ""


client: MongoClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
        print("Connected to MongoDB")
    except Exception as e:
        print("MongoDB connection warning:", e)
    yield
    if client:
        client.close()


app = FastAPI(title="TTD Booking Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db() -> Any:
    if client is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not available")
    return client.ttd


def users_col() -> Collection:
    return db().users


def pilgrims_col() -> Collection:
    return db().pilgrims


def events_col() -> Collection:
    return db().events


def current_user(authorization: Annotated[str, Header()]) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return get_user_id(authorization[7:])


token_dep = Depends(current_user)


@app.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    if users_col().find_one({"username": req.username}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    user = {
        "username": req.username,
        "password_hash": hash_password(req.password),
        "created_at": datetime.utcnow().isoformat(),
    }
    result = users_col().insert_one(user)
    return TokenResponse(access_token=create_access_token(str(result.inserted_id)))


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = users_col().find_one({"username": req.username})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user["_id"])))


@app.get("/auth/me")
def me(user_id: str = token_dep):
    user = users_col().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"id": user_id, "username": user["username"]}


@app.get("/pilgrims")
def get_pilgrims(user_id: str = token_dep):
    docs = list(pilgrims_col().find({"user_id": user_id}, {"_id": 0, "user_id": 0}))
    return docs


@app.post("/pilgrims")
def add_pilgrim(p: Pilgrim, user_id: str = token_dep):
    pilgrim = p.model_dump()
    pilgrim["user_id"] = user_id
    pilgrim["id"] = str(ObjectId())
    pilgrims_col().insert_one(pilgrim)
    pilgrim.pop('_id', None)
    return pilgrim


@app.delete("/pilgrims/{pilgrim_id}")
def delete_pilgrim(pilgrim_id: str, user_id: str = token_dep):
    result = pilgrims_col().delete_one({"id": pilgrim_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pilgrim not found")
    return {"ok": True}


@app.get("/events")
def get_events(user_id: str = token_dep):
    docs = list(events_col().find({"user_id": user_id}, {"_id": 0, "user_id": 0}))
    return docs


@app.post("/events")
def add_event(e: BookingEvent, user_id: str = token_dep):
    event = e.model_dump()
    event["user_id"] = user_id
    event["id"] = str(ObjectId())
    events_col().insert_one(event)
    event.pop('_id', None)
    return event


@app.delete("/events/{event_id}")
def delete_event(event_id: str, user_id: str = token_dep):
    result = events_col().delete_one({"id": event_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
