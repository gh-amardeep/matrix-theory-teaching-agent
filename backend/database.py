"""Database setup: engine, sessions, table creation and DB error handling.

The connection string comes from DATABASE_URL in the .env file
(never hard-code credentials here).
"""

import logging
import os

from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

logger = logging.getLogger("matrix_mentor.database")

DATABASE_URL = os.getenv("DATABASE_URL")

DB_UNAVAILABLE_MESSAGE = (
    "The database is currently unavailable. "
    "Please make sure PostgreSQL is running and DATABASE_URL is correct."
)


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal = None

if DATABASE_URL:
    try:
        # pool_pre_ping drops stale connections (e.g. after PostgreSQL restarts)
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False)
    except Exception:
        logger.exception("Could not create the database engine. Check DATABASE_URL.")
else:
    logger.warning("DATABASE_URL is not set in .env - database features are disabled.")


_tables_ready = False


def init_db():
    """Create the tables if they do not exist yet (safe to call repeatedly)."""
    global _tables_ready
    import models  # noqa: F401  - importing registers the tables on Base

    Base.metadata.create_all(bind=engine)
    _tables_ready = True


def get_db():
    """FastAPI dependency that yields a database session.

    Raises a clear 503 error if PostgreSQL cannot be reached, instead of
    crashing the application. Tables are (re)created lazily, so the app
    also recovers if PostgreSQL was down when FastAPI started.
    """
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)

    if not _tables_ready:
        try:
            init_db()
        except SQLAlchemyError:
            logger.exception("Could not connect to PostgreSQL / create tables.")
            raise HTTPException(status_code=503, detail=DB_UNAVAILABLE_MESSAGE)

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ping(db: Session):
    """Cheap connectivity check; also releases the connection afterwards."""
    db.execute(text("SELECT 1"))
    db.rollback()
