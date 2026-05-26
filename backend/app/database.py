from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_FILE = "meetgraph.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# Connect args needed for SQLite thread compatibility
connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)
    # Check if user_email column exists, if not, add it
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns("meeting")]
    if "user_email" not in columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meeting ADD COLUMN user_email VARCHAR"))
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session
