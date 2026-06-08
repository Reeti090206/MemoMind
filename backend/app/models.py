from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
import json

# Global JSON Helper
class JSONField(SQLModel):
    pass

class Meeting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: str  # Format: YYYY-MM-DD HH:MM
    duration: int  # in seconds
    audio_path: Optional[str] = None
    summary: Optional[str] = None
    efficiency_score: float = 85.0
    tension_score: float = 12.0
    speaker_stats: str = Field(default="{}")  # JSON string representing {"Speaker A": percentage, ...}
    user_email: Optional[str] = Field(default=None, index=True)
    team_name: Optional[str] = Field(default=None)
    parent_meeting_id: Optional[int] = Field(default=None, foreign_key="meeting.id")
    description: Optional[str] = Field(default=None)

    # Relationships
    segments: List["TranscriptSegment"] = Relationship(back_populates="meeting")
    decisions: List["Decision"] = Relationship(back_populates="meeting")
    tasks: List["Task"] = Relationship(back_populates="meeting")
    contradictions: List["Contradiction"] = Relationship(
        back_populates="meeting", 
        sa_relationship_kwargs={"foreign_keys": "Contradiction.meeting_id"}
    )
    unresolved_topics: List["UnresolvedTopic"] = Relationship(
        back_populates="meeting",
        sa_relationship_kwargs={"foreign_keys": "UnresolvedTopic.meeting_id"}
    )
    parent: Optional["Meeting"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Meeting.id"}
    )
    children: List["Meeting"] = Relationship(back_populates="parent")
    invitations: List["MeetingInvitation"] = Relationship(
        back_populates="meeting",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class TranscriptSegment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    speaker_label: str
    start_time: float  # seconds from start
    end_time: float    # seconds from start
    text: str

    # Relationship
    meeting: Optional[Meeting] = Relationship(back_populates="segments")

class Decision(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    text: str
    status: str = Field(default="accepted")  # accepted, rejected, changed, pending
    related_options: str = Field(default="[]")  # JSON list of alternative options discussed
    overrides_decision_id: Optional[int] = Field(default=None, foreign_key="decision.id")

    # Relationships
    meeting: Optional[Meeting] = Relationship(back_populates="decisions")
    tasks: List["Task"] = Relationship(back_populates="decision")

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    decision_id: Optional[int] = Field(default=None, foreign_key="decision.id")
    title: str
    owner: str
    deadline: str  # e.g., "2026-05-28" or "Friday"
    status: str = Field(default="todo")  # todo, in_progress, done
    priority: str = Field(default="medium")  # low, medium, high
    reminder_sent: bool = Field(default=False)

    # Relationships
    meeting: Optional[Meeting] = Relationship(back_populates="tasks")
    decision: Optional[Decision] = Relationship(back_populates="tasks")

class Contradiction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    old_decision_id: int = Field(foreign_key="decision.id")
    new_decision_id: int = Field(foreign_key="decision.id")
    description: str
    confidence_score: float

    # Relationships
    meeting: Optional[Meeting] = Relationship(
        back_populates="contradictions",
        sa_relationship_kwargs={"foreign_keys": "Contradiction.meeting_id"}
    )
    old_decision: Optional[Decision] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Contradiction.old_decision_id"}
    )
    new_decision: Optional[Decision] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Contradiction.new_decision_id"}
    )

class UnresolvedTopic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    topic_name: str
    context: str
    status: str = Field(default="open")  # open, resolved
    resolved_in_meeting_id: Optional[int] = Field(default=None, foreign_key="meeting.id")

    # Relationship
    meeting: Optional[Meeting] = Relationship(
        back_populates="unresolved_topics",
        sa_relationship_kwargs={"foreign_keys": "UnresolvedTopic.meeting_id"}
    )
    resolved_in_meeting: Optional[Meeting] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "UnresolvedTopic.resolved_in_meeting_id"}
    )

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(unique=True, index=True)
    name: str = Field(default="New User")
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: str = Field(default="Workspace Contributor")
    color: str = Field(default="from-cyber-purple to-cyber-cyan")
    password: Optional[str] = Field(default=None)
    welcome_email_sent: bool = Field(default=False)
    onboarding_email_sent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmailQueue(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    name: str
    subject: str
    body_html: str
    status: str = Field(default="pending")  # pending, sending, sent, failed
    attempts: int = Field(default=0)
    max_attempts: int = Field(default=3)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None


class MeetingInvitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: Optional[int] = Field(default=None, foreign_key="meeting.id", nullable=True)
    email: str
    name: Optional[str] = None
    status: str = Field(default="pending")  # pending, accepted, declined
    token: Optional[str] = Field(default=None, index=True)  # unique secure token for email CTA links
    created_at: datetime = Field(default_factory=datetime.utcnow)
    workspace_id: Optional[int] = Field(default=None, foreign_key="workspace.id", nullable=True)

    # Relationship
    meeting: Optional[Meeting] = Relationship(back_populates="invitations")

class UserSettings(SQLModel, table=True):
    user_email: str = Field(primary_key=True, index=True)
    gmeet: bool = Field(default=True)
    zoom: bool = Field(default=False)
    teams: bool = Field(default=False)
    discord: bool = Field(default=True)
    tls_secure: bool = Field(default=False)
    record_indicator: bool = Field(default=True)
    auto_purge: bool = Field(default=False)
    purge_after_days: str = Field(default="Never")
    notification_email: bool = Field(default=True)
    notification_push: bool = Field(default=False)
    notification_inapp: bool = Field(default=True)
    notification_contradictions: bool = Field(default=True)
    openai_key: Optional[str] = Field(default=None)
    postgres_url: Optional[str] = Field(default=None)
    vector_db: str = Field(default="Cloud Search Database")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_email: str = Field(index=True)
    setting_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Workspace(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkspaceMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspace.id")
    email: str = Field(index=True)
    role: str = Field(default="member")  # admin, member
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    action: str  # e.g., "invite_sent", "invite_accepted", "invite_rejected"
    details: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

