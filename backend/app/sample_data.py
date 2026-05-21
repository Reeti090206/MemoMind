from sqlmodel import Session
from app.models import Meeting, TranscriptSegment, Decision, Task, Contradiction, UnresolvedTopic
from app.database import engine
import json

def seed_data():
    with Session(engine) as session:
        # Check if database is already seeded
        if session.query(Meeting).first() is not None:
            print("Database already seeded.")
            return

        print("Seeding rich mockup organizational memory...")

        # 1. MEETINGS
        m1 = Meeting(
            title="Project Alpha Kickoff & DB Planning",
            date="2026-05-10 10:00",
            duration=3540,  # 59 mins
            summary="Kickoff sync for Project Alpha. Focused heavily on high-level database architecture, frontend layout, and developer setup. Aman recommended avoiding microservices to keep the architectural footprint light.",
            efficiency_score=92.0,
            tension_score=8.0,
            speaker_stats=json.dumps({"Aman (Backend)": 45.0, "Reeti (Frontend)": 35.0, "Sarah (Product)": 20.0})
        )

        m2 = Meeting(
            title="Database & Auth Architecture Deep-Dive",
            date="2026-05-14 14:30",
            duration=2880,  # 48 mins
            summary="Technical deep-dive on auth setup and database schema details. Decided on PostgreSQL. Custom JWT authentication vs Clerk OAuth was debated heavily and left unresolved due to pricing and custom schema requirements.",
            efficiency_score=78.5,
            tension_score=24.0,
            speaker_stats=json.dumps({"Aman (Backend)": 50.0, "Reeti (Frontend)": 20.0, "Sarah (Product)": 30.0})
        )

        m3 = Meeting(
            title="SaaS Scaling & Microservices Shift",
            date="2026-05-18 11:15",
            duration=3240,  # 54 mins
            summary="A critical alignment sync where the architectural direction changed. The team decided to shift to microservices for the new user profile and real-time feed endpoints due to updated horizontal scaling projections. Clerk OAuth was finalized.",
            efficiency_score=86.0,
            tension_score=15.0,
            speaker_stats=json.dumps({"Aman (Backend)": 35.0, "Reeti (Frontend)": 45.0, "Sarah (Product)": 20.0})
        )

        session.add_all([m1, m2, m3])
        session.commit()
        session.refresh(m1)
        session.refresh(m2)
        session.refresh(m3)

        # 2. TRANSCRIPT SEGMENTS
        # Meeting 1
        s1_1 = TranscriptSegment(
            meeting_id=m1.id, speaker_label="Aman (Backend)", start_time=0.0, end_time=30.0,
            text="Welcome team to the Project Alpha Kickoff. We need to align on structure. I strongly propose we avoid microservices for this initial launch to prevent overhead."
        )
        s1_2 = TranscriptSegment(
            meeting_id=m1.id, speaker_label="Reeti (Frontend)", start_time=31.0, end_time=55.0,
            text="Agreed. From the frontend side, drawing endpoints from a single monolithic service makes integrating state and data queries way smoother."
        )
        s1_3 = TranscriptSegment(
            meeting_id=m1.id, speaker_label="Sarah (Product)", start_time=56.0, end_time=75.0,
            text="Sounds reasonable. Let's start with a clean monolith. Aman, can you write the database migrations and draft our schemas by this Friday?"
        )
        s1_4 = TranscriptSegment(
            meeting_id=m1.id, speaker_label="Aman (Backend)", start_time=76.0, end_time=95.0,
            text="Yes, I will complete the backend SQLite schema and migration setups by Friday."
        )

        # Meeting 2
        s2_1 = TranscriptSegment(
            meeting_id=m2.id, speaker_label="Aman (Backend)", start_time=0.0, end_time=45.0,
            text="For the database, since we are moving towards production, let's select PostgreSQL over SQLite. It handles concurrent connections much better."
        )
        s2_2 = TranscriptSegment(
            meeting_id=m2.id, speaker_label="Sarah (Product)", start_time=46.0, end_time=75.0,
            text="Agreed, we decided on PostgreSQL. Now, for user login, should we build a custom JWT service or use Clerk?"
        )
        s2_3 = TranscriptSegment(
            meeting_id=m2.id, speaker_label="Aman (Backend)", start_time=76.0, end_time=110.0,
            text="Building custom JWT takes longer, but using Clerk adds external pricing overhead. We need to analyze this in detail. Let's decide later on authentication, pending some pricing reviews."
        )

        # Meeting 3
        s3_1 = TranscriptSegment(
            meeting_id=m3.id, speaker_label="Reeti (Frontend)", start_time=0.0, end_time=40.0,
            text="Hi all, looking at the horizontal scaling needs for user sessions, I think we must migrate to a decoupled microservices layout for the user-profile API."
        )
        s3_2 = TranscriptSegment(
            meeting_id=m3.id, speaker_label="Aman (Backend)", start_time=41.0, end_time=80.0,
            text="I know I originally recommended avoiding microservices, but with the load forecasts for user feeds, I agree. We decided to migrate to microservices for the new user profile models."
        )
        s3_3 = TranscriptSegment(
            meeting_id=m3.id, speaker_label="Sarah (Product)", start_time=81.0, end_time=110.0,
            text="Perfect, let's document that choice. We are migrating to microservices. Also, Clerk oauth is finalized to launch quickly."
        )
        s3_4 = TranscriptSegment(
            meeting_id=m3.id, speaker_label="Reeti (Frontend)", start_time=111.0, end_time=140.0,
            text="Excellent. I will start upgrading the frontend routing and dashboard configurations by next Tuesday."
        )

        session.add_all([s1_1, s1_2, s1_3, s1_4, s2_1, s2_2, s2_3, s3_1, s3_2, s3_3, s3_4])
        session.commit()

        # 3. DECISIONS
        d1 = Decision(
            meeting_id=m1.id,
            text="Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.",
            status="changed",
            related_options=json.dumps(["Microservices cluster", "Serverless micro-routes"])
        )
        d2 = Decision(
            meeting_id=m2.id,
            text="Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.",
            status="accepted",
            related_options=json.dumps(["SQLite", "MySQL"])
        )
        d3 = Decision(
            meeting_id=m3.id,
            text="Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.",
            status="accepted",
            related_options=json.dumps(["Monolithic API extensions"]),
            overrides_decision_id=1 # references avoid microservices
        )
        d4 = Decision(
            meeting_id=m3.id,
            text="Implement Clerk OAuth for user authentication to accelerate launch speed.",
            status="accepted",
            related_options=json.dumps(["Custom JWT tokens", "Auth0 enterprise"])
        )

        session.add_all([d1, d2, d3, d4])
        session.commit()
        session.refresh(d1)
        session.refresh(d2)
        session.refresh(d3)
        session.refresh(d4)

        # Update decision override back-link
        d1.overrides_decision_id = d3.id
        session.add(d1)
        session.commit()

        # 4. TASKS
        t1 = Task(
            meeting_id=m1.id,
            decision_id=d1.id,
            title="Implement core database migrations",
            owner="Aman",
            deadline="2026-05-28",
            status="done",
            priority="high"
        )
        t2 = Task(
            meeting_id=m2.id,
            decision_id=d2.id,
            title="Configure production PostgreSQL clusters and connection pooling",
            owner="Aman",
            deadline="2026-05-30",
            status="in_progress",
            priority="high"
        )
        t3 = Task(
            meeting_id=m3.id,
            decision_id=d3.id,
            title="Update frontend configurations with microservices endpoints",
            owner="Reeti",
            deadline="2026-06-02",
            status="todo",
            priority="medium"
        )
        t4 = Task(
            meeting_id=m3.id,
            decision_id=d4.id,
            title="Integrate Clerk OAuth library into the frontend shell",
            owner="Reeti",
            deadline="2026-05-29",
            status="todo",
            priority="high"
        )

        session.add_all([t1, t2, t3, t4])
        session.commit()

        # 5. CONTRADICTIONS
        c1 = Contradiction(
            meeting_id=m3.id,
            old_decision_id=d1.id,
            new_decision_id=d3.id,
            description="Shifted architectural direction: previously decided to 'Avoid microservices' (Meeting #1) to minimize complexity, but recently 'Decided to migrate to microservices' (Meeting #3) for user-profile scaling.",
            confidence_score=0.88
        )
        session.add(c1)

        # 6. UNRESOLVED TOPICS
        ut1 = UnresolvedTopic(
            meeting_id=m2.id,
            topic_name="Authentication Strategy",
            context="Clerk OAuth vs Custom JWT tokens. Aman expressed pricing concerns. Deferred for pricing analysis.",
            status="resolved",
            resolved_in_meeting_id=m3.id
        )
        ut2 = UnresolvedTopic(
            meeting_id=m3.id,
            topic_name="Real-time WebSockets Gateway",
            context="Debated between using Node.js Socket.io or FastAPI WebSockets for live notifications. Unresolved, pending throughput load-testing.",
            status="open"
        )

        session.add_all([ut1, ut2])
        session.commit()
        print("Mock database populated successfully!")
