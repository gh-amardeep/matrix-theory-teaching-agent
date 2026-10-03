import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import crud
import database
from database import DB_UNAVAILABLE_MESSAGE, get_db

load_dotenv()

logger = logging.getLogger("matrix_mentor")

HF_TOKEN = os.getenv("HF_TOKEN")

client = InferenceClient(token=HF_TOKEN)


# Create the database tables when the application starts.
# If PostgreSQL is down, the app still starts; the endpoints that need
# the database return a clear 503 error until it is available.
@asynccontextmanager
async def lifespan(app: FastAPI):
    if database.engine is not None:
        try:
            database.init_db()
        except SQLAlchemyError:
            logger.exception(
                "Could not initialise the database at startup. "
                "Is PostgreSQL running and is DATABASE_URL correct?"
            )
    yield


# Create FastAPI application
app = FastAPI(title="Matrix Theory Teaching Agent", lifespan=lifespan)


# Allow our HTML/JavaScript frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request format
class Question(BaseModel):
    question: str
    # Optional: identifies the conversation. The frontend sends its chat id;
    # if it is missing, a new chat is created.
    chat_id: Optional[str] = Field(default=None, max_length=64)


# Response formats for the history endpoints
class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: int
    role: str
    content: str
    timestamp: datetime


class ChatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chat_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]


# Teaching Agent instructions
# Load Matrix Theory teaching context
BASE_DIR = Path(__file__).resolve().parent.parent
CONTEXT_FILE = BASE_DIR / "context.md"

with open(CONTEXT_FILE, "r", encoding="utf-8") as file:
    SYSTEM_PROMPT = file.read()


# API endpoint
@app.post("/ask")
def ask_question(data: Question, db: Session = Depends(get_db)):

    # Fail fast (before spending an LLM call) if PostgreSQL is unreachable
    try:
        database.ping(db)
    except SQLAlchemyError:
        logger.exception("PostgreSQL is unreachable.")
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)

    chat_id = data.chat_id or uuid.uuid4().hex
    asked_at = datetime.now(timezone.utc)

    # Ask the LLM exactly as before: context.md + the student's question
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": data.question
                }
            ],
            max_tokens=1000
        )
        answer = response.choices[0].message.content
    except Exception:
        logger.exception("Hugging Face request failed.")
        raise HTTPException(
            status_code=502,
            detail="The teaching model could not answer right now. Please try again."
        )

    if not answer:
        logger.error("The model returned an empty answer.")
        raise HTTPException(
            status_code=502,
            detail="The teaching model returned an empty answer. Please try again."
        )

    # Store both the question and the answer
    try:
        crud.save_exchange(db, chat_id, data.question, answer, asked_at)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save the conversation to PostgreSQL.")
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)

    # "answer" is unchanged, so the existing frontend keeps working
    return {
        "answer": answer,
        "chat_id": chat_id
    }


# Stored conversations (newest first)
@app.get("/history", response_model=list[ChatOut])
def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        return crud.list_chats(db, limit, offset)
    except SQLAlchemyError:
        logger.exception("Could not read history from PostgreSQL.")
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)


# One complete stored conversation
@app.get("/history/{chat_id}", response_model=ChatOut)
def get_chat_history(chat_id: str, db: Session = Depends(get_db)):
    try:
        chat = crud.get_chat(db, chat_id)
    except SQLAlchemyError:
        logger.exception("Could not read chat from PostgreSQL.")
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found.")

    return chat


# Simple test endpoint
@app.get("/")
def home():
    return {
        "message": "Matrix Theory Teaching Agent API is running!"
    }
