from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_FILE = "meetgraph.db"
DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{DATABASE_FILE}"

# Connect args needed for SQLite thread compatibility
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif DATABASE_URL.startswith("postgres://"):
    # SQLAlchemy requires postgresql:// instead of postgres://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def init_db():
    from app.models import UserSettings, SettingsHistory, Workspace, WorkspaceMember, AuditLog, EmailQueue
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
    if "parent_meeting_id" not in columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meeting ADD COLUMN parent_meeting_id INTEGER"))
            session.commit()
    if "description" not in columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meeting ADD COLUMN description VARCHAR"))
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
            
    # Check if reminder_sent column exists in task table
    task_columns = [col["name"] for col in inspector.get_columns("task")]
    if "reminder_sent" not in task_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE task ADD COLUMN reminder_sent BOOLEAN DEFAULT 0"))
            session.commit()

    # Check if welcome_email_sent column exists in user table
    user_columns = [col["name"] for col in inspector.get_columns("user")]
    if "welcome_email_sent" not in user_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE user ADD COLUMN welcome_email_sent BOOLEAN DEFAULT 0"))
            session.commit()
    if "onboarding_email_sent" not in user_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE user ADD COLUMN onboarding_email_sent BOOLEAN DEFAULT 0"))
            session.commit()

    # Check meetinginvitation columns for token and created_at
    invitation_columns = [col["name"] for col in inspector.get_columns("meetinginvitation")]
    if "token" not in invitation_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meetinginvitation ADD COLUMN token VARCHAR"))
            session.commit()
            
            # Backfill existing invitations with tokens
            import secrets
            invs = session.execute(text("SELECT id FROM meetinginvitation WHERE token IS NULL")).all()
            for inv_row in invs:
                inv_id = inv_row[0]
                session.execute(
                    text("UPDATE meetinginvitation SET token = :token WHERE id = :id"),
                    {"token": secrets.token_urlsafe(32), "id": inv_id}
                )
            session.commit()

    if "created_at" not in invitation_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meetinginvitation ADD COLUMN created_at DATETIME"))
            session.commit()
            session.execute(text("UPDATE meetinginvitation SET created_at = datetime('now') WHERE created_at IS NULL"))
            session.commit()

    if "workspace_id" not in invitation_columns:
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meetinginvitation ADD COLUMN workspace_id INTEGER"))
            session.commit()

    # Ensure meeting_id column in meetinginvitation table is nullable (needed for workspace invitations)
    meeting_id_col = next((c for c in inspector.get_columns("meetinginvitation") if c["name"] == "meeting_id"), None)
    if meeting_id_col and not meeting_id_col.get("nullable", True):
        with Session(engine) as session:
            session.execute(text("ALTER TABLE meetinginvitation RENAME TO _meetinginvitation_old"))
            session.commit()
            
            from app.models import MeetingInvitation
            SQLModel.metadata.tables["meetinginvitation"].create(engine)
            
            session.execute(text("""
                INSERT INTO meetinginvitation (id, meeting_id, email, name, status, token, created_at, workspace_id)
                SELECT id, meeting_id, email, name, status, token, created_at, workspace_id
                FROM _meetinginvitation_old
            """))
            session.commit()
            
            session.execute(text("DROP TABLE _meetinginvitation_old"))
            session.commit()

    # Create default workspace and standard team workspaces if they don't exist
    with Session(engine) as session:
        for ws_name in ['Default Workspace', 'Team Alpha', 'Backend Team', 'Cloud Team', 'Acme Corp']:
            ws = session.execute(text("SELECT id FROM workspace WHERE name = :name"), {"name": ws_name}).first()
            if not ws:
                session.execute(
                    text("INSERT INTO workspace (name, created_at) VALUES (:name, datetime('now'))"),
                    {"name": ws_name}
                )
                session.commit()

def get_session():
    with Session(engine) as session:
        yield session
