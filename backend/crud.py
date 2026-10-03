"""Database read/write helpers. No LLM or HTTP logic lives here."""

import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models import Chat, Message


def make_title(question: str) -> str:
    """Same rule the frontend uses: collapse spaces, cut at 45 characters."""
    title = re.sub(r"\s+", " ", question.strip())
    if len(title) > 45:
        title = title[:45] + "..."
    return title


def save_exchange(
    db: Session, chat_id: str, question: str, answer: str, asked_at: datetime
) -> None:
    """Store the student's question and the agent's answer in one transaction."""
    answered_at = datetime.now(timezone.utc)

    chat = db.get(Chat, chat_id)
    if chat is None:
        chat = Chat(
            chat_id=chat_id,
            title=make_title(question),
            created_at=asked_at,
            updated_at=answered_at,
        )
        db.add(chat)
        db.flush()  # make sure the chat row exists before its messages
    else:
        chat.updated_at = answered_at

    db.add(Message(chat_id=chat_id, role="student", content=question, timestamp=asked_at))
    db.add(Message(chat_id=chat_id, role="agent", content=answer, timestamp=answered_at))
    db.commit()


def list_chats(db: Session, limit: int, offset: int) -> list[Chat]:
    stmt = (
        select(Chat)
        .options(selectinload(Chat.messages))
        .order_by(Chat.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt))


def get_chat(db: Session, chat_id: str) -> Chat | None:
    stmt = (
        select(Chat)
        .options(selectinload(Chat.messages))
        .where(Chat.chat_id == chat_id)
    )
    return db.scalars(stmt).first()
