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
    if "team_name" not in columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meeting ADD COLUMN team_name VARCHAR"))
            session.commit()
            
            # Backfill existing meetings with team names based on their titles
            meetings = session.execute(text("SELECT id, title FROM meeting")).all()
            for m_id, title in meetings:
                title_lower = title.lower() if title else ""
                guessed_team = "Team Alpha"
                if "backend" in title_lower or "database" in title_lower or "auth" in title_lower:
                    guessed_team = "Backend Team"
                elif "client" in title_lower or "acme" in title_lower:
                    guessed_team = "Acme Corp"
                elif "saas" in title_lower or "scaling" in title_lower:
                    guessed_team = "Cloud Team"
                session.execute(
                    text("UPDATE meeting SET team_name = :team WHERE id = :id"),
                    {"team": guessed_team, "id": m_id}
                )
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session
