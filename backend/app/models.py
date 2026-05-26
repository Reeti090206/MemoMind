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
    created_at: datetime = Field(default_factory=datetime.utcnow)
