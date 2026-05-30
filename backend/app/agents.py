import os
import json
import re
import tempfile
import asyncio
import base64
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select
from app.models import Meeting, TranscriptSegment, Decision, Task, Contradiction, UnresolvedTopic, UserSettings

# Custom logger for agents
def agent_log(agent_name: str, message: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] [{agent_name}] {message}")

class AudioAgent:
    """
    Handles audio transcription and speech-based metadata extraction.
    Uses Whisper for STT and formats transcripts dynamically.
    """
    def __init__(self, openai_client):
        self.openai_client = openai_client

    async def transcribe_chunk(self, audio_data: bytes) -> Dict[str, Any]:
        """Transcribes a raw audio blob using OpenAI Whisper."""
        if not self.openai_client:
            agent_log("AudioAgent", "No OpenAI client available. Skipping transcription.")
            return {"text": "", "segments": []}

        # Write to temporary file for Whisper API compatibility
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name

        try:
            agent_log("AudioAgent", f"Sending {len(audio_data)} bytes to Whisper...")
            
            # Execute transcription in a separate thread to prevent blocking
            def call_whisper():
                with open(temp_file_path, "rb") as audio_file:
                    return self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"]
                    )
            
            response = await asyncio.to_thread(call_whisper)
            
            raw_text = response.text if hasattr(response, "text") else ""
            segments = []
            if hasattr(response, "segments"):
                for seg in response.segments:
                    segments.append({
                        "text": seg.get("text", ""),
                        "start": seg.get("start", 0.0),
                        "end": seg.get("end", 0.0),
                        # Default temporary speaker label. Will be resolved by ParticipantDetectionAgent
                        "speaker": "Speaker"
                    })
                    
            agent_log("AudioAgent", f"Transcription complete. Length: {len(raw_text)} chars.")
            return {"text": raw_text, "segments": segments}
        except Exception as e:
            agent_log("AudioAgent", f"Transcription failed: {e}")
            return {"text": "", "segments": []}
        finally:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

    async def identify_spoken_details(self, text: str) -> Dict[str, Any]:
        """Extracts spoken introductions, spoken names, or immediate action items from the raw text."""
        if not self.openai_client or not text.strip():
            return self._fallback_dialogue_extraction(text)

        prompt = f"""You are an Audio Dialogue Extraction Agent. Analyze this meeting transcript snippet.
        
        TEXT:
        "{text}"
        
        Extract:
        1. Names of speakers/participants who introduced themselves or were spoken to (e.g. "I'm David", "Thanks David").
        2. Spoken decisions made in the dialogue.
        3. Action items discussed, matching them to the owner if mentioned.
        
        Strictly avoid placeholders or hardcoded names. Only extract details mentioned in the text.
        Return ONLY valid JSON:
        {{
          "names": ["Name1", "Name2"],
          "decisions": ["Decision statement"],
          "tasks": [{{"title": "Task description", "owner": "Name", "deadline": "When"}}]
        }}
        """
        try:
            def call_gpt():
                return self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a dialogue parser. Return only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
            res = await asyncio.to_thread(call_gpt)
            data = json.loads(res.choices[0].message.content.strip())
            return data
        except Exception as e:
            agent_log("AudioAgent", f"Metadata extraction error: {e}. Falling back to offline heuristics.")
            return self._fallback_dialogue_extraction(text)

    def _fallback_dialogue_extraction(self, text: str) -> Dict[str, Any]:
        names = []
        # Look for introductions like "I'm Alice", "I am Bob", "This is James"
        intro_matches = re.findall(r"\b(?:i'm|i am|this is|my name is|speaking is)\s+([A-Z][a-z]+)\b", text, re.IGNORECASE)
        for name in intro_matches:
            if name.lower() not in ["speaker", "user", "someone", "unknown", "none", "aman", "sarah", "reeti"]:
                names.append(name.capitalize())
        
        # Look for spoken tasks
        tasks = []
        task_keywords = ["need to", "must", "should", "will write", "will build", "will test", "will fix", "action item", "will implement"]
        if any(kw in text.lower() for kw in task_keywords):
            title = text.strip()
            title = re.split(r'[.!?]', title)[0].strip()
            owner = "Unassigned"
            for n in names:
                if n.lower() in text.lower():
                    owner = n
                    break
            
            priority = "medium"
            if "urgent" in text.lower() or "critical" in text.lower():
                priority = "high"
                
            tasks.append({
                "title": title,
                "owner": owner,
                "deadline": "Next Sync",
                "priority": priority
            })
            
        return {
            "names": list(set(names)),
            "decisions": [text] if "decided to" in text.lower() or "agreed to" in text.lower() else [],
            "tasks": tasks
        }


class ScreenAnalysisAgent:
    """
    Ingests video frames (base64) from screen shares.
    Uses GPT-4o-mini with Vision to do OCR, tab/app detection, participant UI parsing, and context mapping.
    """
    def __init__(self, openai_client):
        self.openai_client = openai_client
        self.last_app = "None"
        self.last_visual_summary = "Idle screen share"

    async def analyze_frame(self, base64_image: str) -> Dict[str, Any]:
        """Runs Vision AI analysis on the screen share snapshot."""
        if not self.openai_client:
            agent_log("ScreenAnalysisAgent", "No OpenAI client available. Vision analysis skipped.")
            return {}

        # Strip headers if present
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        prompt = """You are a Screen Share Visual Analysis Agent for a meeting intelligence system.
        Analyze this screenshot from a shared screen. Extract:
        1. Active App/Tab: Identify the main application or browser tab shown (e.g. "VS Code - main.py", "Figma - Login Mockup", "Google Meet Grid", "Jira Sprint Board"). Keep it concise.
        2. Visual Context Summary: What is the user doing? (e.g. "Writing python code", "Reviewing high-fidelity UI mockup", "Reviewing project timeline slides").
        3. Participant Names: Look closely at the screen. If this is a meeting app (Google Meet, Zoom, Teams), extract any participant names shown in the video grids, participant lists, or active speaker highlights. Do not include mock placeholder names, only read real text.
        4. OCR Snippet: Extract any important text, code snippets, or slide titles visible.
        
        Return ONLY valid JSON:
        {
          "active_app_or_tab": "Application name",
          "visual_context_summary": "Summary",
          "visible_participants": ["Name1", "Name2"],
          "ocr_snippet": "Text"
        }
        """

        try:
            agent_log("ScreenAnalysisAgent", "Sending screen frame to GPT-4o-mini Vision...")
            def call_gpt_vision():
                return self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=500,
                    temperature=0.1
                )
            
            res = await asyncio.to_thread(call_gpt_vision)
            data = json.loads(res.choices[0].message.content.strip())
            
            self.last_app = data.get("active_app_or_tab", "Unknown")
            self.last_visual_summary = data.get("visual_context_summary", "No visual context")
            
            agent_log("ScreenAnalysisAgent", f"Vision Analysis complete. App detected: {self.last_app}")
            return data
        except Exception as e:
            agent_log("ScreenAnalysisAgent", f"Vision analysis failed: {e}")
            return {
                "active_app_or_tab": self.last_app,
                "visual_context_summary": self.last_visual_summary,
                "visible_participants": [],
                "ocr_snippet": ""
            }


class ParticipantDetectionAgent:
    """
    Tracks and matches real meeting participant identities.
    Synthesizes names spoken in Audio and visible in Screen visual UI.
    Maps anonymous speaker labels (e.g. Speaker A) to real names.
    """
    def __init__(self):
        self.participants = set()
        self.speaker_mappings = {} # Speaker label -> Real Name

    def process_identities(self, spoken_names: List[str], visual_names: List[str], transcript_segments: List[Dict[str, Any]]):
        """Merges discovered names and updates mappings."""
        # Add to the set of real participants
        for name in spoken_names + visual_names:
            cleaned = name.strip()
            # Ignore placeholder/generic values
            if cleaned and cleaned.lower() not in ["speaker", "user", "someone", "unknown", "none", "aman", "sarah", "reeti"]:
                self.participants.add(cleaned)

        # Attempt to map speaker labels based on dialogue introductions (e.g. "I am James" spoken by "Speaker 1")
        for seg in transcript_segments:
            speaker_label = seg.get("speaker", "")
            text = seg.get("text", "")
            if not speaker_label or speaker_label in self.speaker_mappings.values():
                continue

            # Look for "I am X" or "This is X"
            match = re.search(r"\b(?:i'm|i am|this is|my name is|speaking is)\s+([A-Z][a-z]+)\b", text, re.IGNORECASE)
            if match:
                detected_name = match.group(1)
                if detected_name in self.participants:
                    self.speaker_mappings[speaker_label] = detected_name
                    agent_log("ParticipantDetectionAgent", f"Mapped {speaker_label} -> {detected_name} via introduction")

    def get_real_name(self, speaker_label: str) -> str:
        """Returns mapped real name, falling back to speaker label."""
        return self.speaker_mappings.get(speaker_label, speaker_label)

    def get_participants_list(self) -> List[str]:
        """Returns list of active participants, mapping speaker labels if set."""
        # Mix in explicitly mapped names plus any residual names detected
        all_names = set(self.participants)
        for val in self.speaker_mappings.values():
            all_names.add(val)
        return sorted(list(all_names))


class TaskExtractionAgent:
    """
    Identifies tasks, owners, and deadlines.
    Ensures tasks are mapped to actual detected participants.
    Strictly avoids hallucination of assignments.
    """
    def __init__(self):
        self.extracted_tasks = []

    def extract_tasks_from_context(self, transcript_segments: List[Dict[str, Any]], participants: List[str]) -> List[Dict[str, Any]]:
        """Scans transcript segments and visual details to pull out task assignees."""
        tasks = []
        task_keywords = ["need to", "must", "should", "will write", "will build", "will test", "will fix", "action item", "tasked with", "assigned to"]
        
        # Simple extraction rule: scan segments for actionable words
        for seg in transcript_segments:
            text = seg.get("text", "")
            speaker = seg.get("speaker", "Unknown")
            
            # Check if text contains task keywords
            if any(kw in text.lower() for kw in task_keywords):
                # Clean and isolate task statement
                cleaned_text = re.sub(r'^(?:so|well|then|basically)\s*,?\s*', '', text, flags=re.IGNORECASE)
                
                # Check if anyone in the active participants list is mentioned
                assigned_owner = "Unassigned"
                for p in participants:
                    if p.lower() in text.lower():
                        assigned_owner = p
                        break
                        
                # Fall back to speaker if self-assigned
                if assigned_owner == "Unassigned" and ("i will" in text.lower() or "i'll" in text.lower() or "i need to" in text.lower()):
                    if speaker != "Unknown" and not speaker.startswith("Speaker"):
                        assigned_owner = speaker
                
                # Parse deadline
                deadline = "Next Sync"
                if "friday" in text.lower(): deadline = "Friday"
                elif "monday" in text.lower(): deadline = "Monday"
                elif "tomorrow" in text.lower(): deadline = "Tomorrow"
                elif "next week" in text.lower(): deadline = "Next Week"
                
                # Simple priority
                priority = "medium"
                if "urgent" in text.lower() or "asap" in text.lower() or "critical" in text.lower() or "today" in text.lower():
                    priority = "high"
                elif "low" in text.lower() or "someday" in text.lower():
                    priority = "low"

                # Check for duplicates
                task_title = cleaned_text.strip()
                # Trim to first punctuation
                task_title = re.split(r'[.!?]', task_title)[0].strip()
                if len(task_title) > 8 and not any(t["title"].lower() == task_title.lower() for t in tasks):
                    tasks.append({
                        "title": task_title,
                        "owner": assigned_owner,
                        "deadline": deadline,
                        "priority": priority
                    })
                    
        self.extracted_tasks = tasks
        return tasks


class SummaryAgent:
    """
    Generates structured meeting briefs, unresolved topics,
    and decision records based on real session content.
    """
    def __init__(self, openai_client):
        self.openai_client = openai_client

    async def compile_final_brief(self, title: str, segments: List[Dict[str, Any]], visual_logs: List[str], active_apps: List[str]) -> Dict[str, Any]:
        """Assembles transcription details and visual logs to produce final meeting intelligence."""
        if not self.openai_client:
            return self._fallback_final_brief(title, segments, active_apps)

        # Compile segments and screen events
        dialogue = "\n".join([f"{s['speaker']}: {s['text']}" for s in segments])
        visuals = "\n".join(visual_logs[-20:]) # Last 20 screen logs
        apps = ", ".join(list(set(active_apps)))

        prompt = f"""You are a Meeting Summary and Intelligence Agent.
        Review this meeting log containing spoken dialogue and visual screen events.
        
        MEETING TITLE: "{title}"
        ACTIVE APPLICATIONS SHOWN ON SCREEN: {apps}
        
        VISUAL STREAM LOGS:
        {visuals}
        
        SPOKEN DIALOGUE TRANSCRIPT:
        {dialogue}
        
        Extract:
        1. A high-quality, 2-3 sentence overview summary of the meeting. Include key discussion points and visual contexts (e.g. Figma mockups, VS Code sessions).
        2. Decisions made (resolved topics).
        3. Unresolved topics (items postponed, debated, or tabled).
        4. Tension score (0 to 100, where 0 is perfect alignment and 100 is heavy conflict/argument).
        5. Efficiency score (0 to 100, representing how productive the meeting was).
        
        Strictly avoid hallucinations. Only extract elements discussed in the transcript or shown on screen.
        Return ONLY valid JSON matching this format:
        {{
          "summary": "Concise summary",
          "decisions": [
            {{"text": "Decision statement", "status": "accepted", "related_options": ["Option A", "Option B"]}}
          ],
          "unresolved_topics": [
            {{"topic_name": "Topic", "context": "Detailed explanation of why it is unresolved"}}
          ],
          "tension_score": 15.0,
          "efficiency_score": 90.0
        }}
        """

        try:
            agent_log("SummaryAgent", "Requesting final summary compilation...")
            def call_gpt():
                return self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a summary compiler. Return only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
            
            res = await asyncio.to_thread(call_gpt)
            data = json.loads(res.choices[0].message.content.strip())
            agent_log("SummaryAgent", "Summary compilation complete.")
            return data
        except Exception as e:
            agent_log("SummaryAgent", f"Summary compilation failed: {e}. Falling back to heuristics.")
            return self._fallback_final_brief(title, segments, active_apps)

    def _fallback_final_brief(self, title: str, segments: List[Dict[str, Any]], active_apps: List[str]) -> Dict[str, Any]:
        dialogue = " ".join([s["text"] for s in segments])
        summary = "No conversation dialogue recorded."
        if segments:
            first_text = segments[0]["text"]
            last_text = segments[-1]["text"]
            summary = f"Real dialogue session covering: '{first_text[:70]}...'. Active apps observed: {', '.join(active_apps) if active_apps else 'None'}."
            
        decisions = []
        for s in segments:
            text = s["text"]
            if "decided to" in text.lower() or "agreed to" in text.lower() or "decided on" in text.lower():
                dec_text = text
                dec_text = re.split(r'[.!?]', dec_text)[0].strip()
                decisions.append({
                    "text": dec_text,
                    "status": "accepted",
                    "related_options": []
                })
        
        if not decisions and segments:
            dec_text = f"Discussed meeting agenda and workflow for {title}"
            decisions.append({
                "text": dec_text,
                "status": "accepted",
                "related_options": []
            })
            
        unresolved = []
        if "later" in dialogue.lower() or "not sure" in dialogue.lower() or "review next" in dialogue.lower():
            unresolved.append({
                "topic_name": "Deferred Discussions",
                "context": "Discussion was deferred to a future session."
            })
            
        return {
            "summary": summary,
            "decisions": decisions,
            "unresolved_topics": unresolved,
            "tension_score": 10.0,
            "efficiency_score": 90.0
        }


class LiveStreamOrchestratorAgent:
    """
    Coordinate and manage real-time streams (audio bytes + screen share frames).
    Synchronizes processing pipeline and pushes dynamic updates to the client.
    """
    def __init__(self, openai_client, db_session: Session, title: str = "Live Meeting", user_email: Optional[str] = None):
        self.openai_client = openai_client
        self.db = db_session
        self.meeting_title = title
        self.user_email = user_email
        
        # Instantiate Agents
        self.audio_agent = AudioAgent(openai_client)
        self.screen_agent = ScreenAnalysisAgent(openai_client)
        self.participant_agent = ParticipantDetectionAgent()
        self.task_agent = TaskExtractionAgent()
        self.summary_agent = SummaryAgent(openai_client)

        # Ingestion buffers & records
        self.audio_buffer = bytearray()
        self.transcript_segments = []
        self.screen_logs = []
        self.detected_apps = []
        self.active_app = "None"
        self.active_speaker = "None"
        
        # Historical context memory loaded from database
        self.past_decisions = []
        self.load_historical_memory()

    def load_historical_memory(self):
        """Loads past decisions from DB for contradiction testing."""
        try:
            if self.user_email:
                self.past_decisions = self.db.exec(
                    select(Decision).join(Meeting, Decision.meeting_id == Meeting.id).where(Meeting.user_email == self.user_email)
                ).all()
            else:
                self.past_decisions = self.db.exec(select(Decision)).all()
            agent_log("Orchestrator", f"Loaded {len(self.past_decisions)} past decisions from DB into memory.")
        except Exception as e:
            agent_log("Orchestrator", f"Failed to load historical memory: {e}")

    def add_audio_bytes(self, chunk: bytes):
        """Appends streaming audio bytes."""
        self.audio_buffer.extend(chunk)

    async def add_transcript_text(self, text: str):
        """Adds text from client speech recognition directly to segments list."""
        if not text.strip():
            return
            
        # Avoid duplication of recent segments
        if self.transcript_segments and self.transcript_segments[-1]["text"].lower().strip() == text.lower().strip():
            return
            
        # Parse names / details spoken (falls back to regex if vision/gpt offline)
        details = await self.audio_agent.identify_spoken_details(text)
        spoken_names = details.get("names", [])
        
        # Determine speaker label
        speaker_label = f"Speaker {1 + (len(self.transcript_segments) % 2)}"
        
        # Feed spoken names to participant agent
        self.participant_agent.process_identities(
            spoken_names=spoken_names,
            visual_names=[],
            transcript_segments=[{"speaker": speaker_label, "text": text}]
        )
        
        # Get real mapped name
        real_speaker = self.participant_agent.get_real_name(speaker_label)
        self.active_speaker = real_speaker
        
        self.transcript_segments.append({
            "speaker": real_speaker,
            "text": text,
            "start": len(self.transcript_segments) * 5.0,
            "end": (len(self.transcript_segments) + 1) * 5.0
        })
        
        # Run Task Extraction
        self.task_agent.extract_tasks_from_context(
            self.transcript_segments,
            self.participant_agent.get_participants_list()
        )

    async def ingest_screen_frame(self, base64_image: str) -> Dict[str, Any]:
        """Ingests screen share frame, invokes Screen Agent, updates registry."""
        vision_res = await self.screen_agent.analyze_frame(base64_image)
        
        app = vision_res.get("active_app_or_tab", "Unknown")
        self.active_app = app
        self.detected_apps.append(app)
        
        summary = vision_res.get("visual_context_summary", "")
        visible_parts = vision_res.get("visible_participants", [])
        ocr = vision_res.get("ocr_snippet", "")

        log_msg = f"Screen updated: showing {app}."
        if summary:
            log_msg += f" Visual context: {summary}."
        self.screen_logs.append(log_msg)

        # Feed participant names to registry
        self.participant_agent.process_identities(
            spoken_names=[],
            visual_names=visible_parts,
            transcript_segments=self.transcript_segments
        )

        return {
            "app": app,
            "summary": summary,
            "participants": visible_parts,
            "ocr": ocr
        }

    async def process_live_transcribe(self) -> Dict[str, Any]:
        """Transcribes current accumulated audio buffer and processes dialogue metadata."""
        if len(self.audio_buffer) == 0:
            return {}

        res = await self.audio_agent.transcribe_chunk(bytes(self.audio_buffer))
        raw_text = res.get("text", "")
        segments = res.get("segments", [])

        if segments:
            # Assign speaker labels temporarily
            # For simplicity, Whisper segments are mapped sequentially
            for i, s in enumerate(segments):
                s["speaker"] = f"Speaker {1 + (i % 2)}"

            self.transcript_segments = segments


        # Identify spoken names/details
        details = await self.audio_agent.identify_spoken_details(raw_text)
        spoken_names = details.get("names", [])
        
        # Feed spoken names to participant agent
        self.participant_agent.process_identities(
            spoken_names=spoken_names,
            visual_names=[],
            transcript_segments=segments
        )

        # Resolve speaker labels to real names in the segments list
        for s in self.transcript_segments:
            s["speaker"] = self.participant_agent.get_real_name(s["speaker"])

        # Determine active speaker from the final segment
        if segments:
            self.active_speaker = segments[-1]["speaker"]

        # Run Task Extraction Agent
        self.task_agent.extract_tasks_from_context(
            self.transcript_segments,
            self.participant_agent.get_participants_list()
        )

        return {
            "text": raw_text,
            "segments": self.transcript_segments,
            "spoken_names": spoken_names,
            "tasks": self.task_agent.extracted_tasks
        }

    def detect_realtime_contradictions(self, current_decisions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Checks current decisions against historical memory."""
        if self.user_email:
            settings = self.db.get(UserSettings, self.user_email)
            if settings and not settings.notification_contradictions:
                return []
                
        contradictions = []
        for new_dec in current_decisions:
            new_text = new_dec.get("text", "").lower()
            for old_dec in self.past_decisions:
                old_text = old_dec.text.lower()
                
                # Check for direct contradictions (e.g. Monolith vs Microservices, JWT vs OAuth)
                if ("microservices" in new_text and "monolith" in old_text) or ("monolith" in new_text and "microservices" in old_text):
                    contradictions.append({
                        "id": f"contra-{old_dec.id}",
                        "title": "Architecture Clash",
                        "desc": f"Plan alert! Decided to deploy microservices, which contradicts past decision: '{old_dec.text}' (Meeting #{old_dec.meeting_id}).",
                        "severity": "high"
                    })
                elif ("clerk" in new_text and "jwt" in old_text) or ("jwt" in new_text and "clerk" in old_text):
                    contradictions.append({
                        "id": f"contra-{old_dec.id}",
                        "title": "Auth Setup Change",
                        "desc": f"Authentication warning: switching to Clerk, which conflicts with previous agreement: '{old_dec.text}' (Meeting #{old_dec.meeting_id}).",
                        "severity": "medium"
                    })
                elif ("avoid" in new_text and "implement" in old_text and any(w in new_text and w in old_text for w in ["ci/cd", "docker", "redis", "database"])):
                    contradictions.append({
                        "id": f"contra-{old_dec.id}",
                        "title": "Process Override",
                        "desc": f"Decision conflict: deciding to avoid practice which was previously accepted: '{old_dec.text}'.",
                        "severity": "medium"
                    })
        return contradictions

    async def compile_final_meeting(self) -> Meeting:
        """Invokes Summary Agent to compile final results, and commits to SQLModel database."""
        # 1. Compile final summary brief
        summary_res = await self.summary_agent.compile_final_brief(
            self.meeting_title,
            self.transcript_segments,
            self.screen_logs,
            self.detected_apps
        )

        # 2. Extract final tasks
        participants = self.participant_agent.get_participants_list()
        final_tasks = self.task_agent.extract_tasks_from_context(self.transcript_segments, participants)

        # Calculate speaker distribution percentages
        speaker_stats = {}
        if self.transcript_segments:
            speaker_counts = {}
            for s in self.transcript_segments:
                spk = s["speaker"]
                speaker_counts[spk] = speaker_counts.get(spk, 0) + len(s["text"])
            total = sum(speaker_counts.values())
            speaker_stats = {spk: round((val / total) * 100, 1) for spk, val in speaker_counts.items()} if total > 0 else {}

        # Determine team name based on title or other indicators, default to "Team Alpha"
        title_lower = self.meeting_title.lower() if self.meeting_title else ""
        guessed_team = "Team Alpha"
        if "backend" in title_lower or "database" in title_lower or "auth" in title_lower:
            guessed_team = "Backend Team"
        elif "client" in title_lower or "acme" in title_lower:
            guessed_team = "Acme Corp"
        elif "saas" in title_lower or "scaling" in title_lower or "cloud" in title_lower:
            guessed_team = "Cloud Team"

        # Save audio buffer to file if not empty
        audio_path = None
        if self.audio_buffer:
            import uuid
            os.makedirs("uploads", exist_ok=True)
            filename = f"live_session_{uuid.uuid4().hex}.webm"
            path = os.path.join("uploads", filename)
            try:
                with open(path, "wb") as f:
                    f.write(self.audio_buffer)
                audio_path = path
            except Exception as e:
                print(f"[Orchestrator Save Audio Error] {e}")

        # 3. Create Meeting Record
        meeting = Meeting(
            title=self.meeting_title,
            date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            duration=len(self.transcript_segments) * 10 if self.transcript_segments else 60,
            summary=summary_res.get("summary", ""),
            efficiency_score=summary_res.get("efficiency_score", 85.0),
            tension_score=summary_res.get("tension_score", 10.0),
            speaker_stats=json.dumps(speaker_stats),
            user_email=self.user_email,
            team_name=guessed_team,
            audio_path=audio_path
        )
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)

        # 4. Save Transcript Segments
        for seg in self.transcript_segments:
            db_seg = TranscriptSegment(
                meeting_id=meeting.id,
                speaker_label=seg["speaker"],
                start_time=seg["start"],
                end_time=seg["end"],
                text=seg["text"]
            )
            self.db.add(db_seg)

        # 5. Save Decisions
        saved_decisions = []
        for dec in summary_res.get("decisions", []):
            db_dec = Decision(
                meeting_id=meeting.id,
                text=dec["text"],
                status=dec.get("status", "accepted"),
                related_options=json.dumps(dec.get("related_options", []))
            )
            self.db.add(db_dec)
            self.db.commit()
            self.db.refresh(db_dec)
            saved_decisions.append(db_dec)

        # 6. Save Tasks (linked to decisions sequentially)
        for i, t in enumerate(final_tasks):
            dec_id = saved_decisions[i % len(saved_decisions)].id if saved_decisions else None
            db_task = Task(
                meeting_id=meeting.id,
                decision_id=dec_id,
                title=t["title"],
                owner=t["owner"],
                deadline=t["deadline"],
                status="todo",
                priority=t["priority"]
            )
            self.db.add(db_task)

        # 7. Save Unresolved Topics
        for ut in summary_res.get("unresolved_topics", []):
            db_ut = UnresolvedTopic(
                meeting_id=meeting.id,
                topic_name=ut["topic_name"],
                context=ut["context"],
                status="open"
            )
            self.db.add(db_ut)

        # 8. Check and Save Contradictions
        # Re-map standard dictionaries for checking
        new_dec_dicts = [{"id": d.id, "text": d.text} for d in saved_decisions]
        contradictions = self.detect_realtime_contradictions(new_dec_dicts)
        for c in contradictions:
            # Parse past decision ID from custom ID
            old_id = int(c["id"].split("-")[1])
            new_dec = next((d for d in saved_decisions if f"contra-{d.id}" == c["id"] or f"contra-{saved_decisions[0].id}" == c["id"]), saved_decisions[0])
            
            db_contra = Contradiction(
                meeting_id=meeting.id,
                old_decision_id=old_id,
                new_decision_id=new_dec.id,
                description=c["desc"],
                confidence_score=0.85
            )
            self.db.add(db_contra)

            # Update past decision status
            past_d = self.db.get(Decision, old_id)
            if past_d:
                past_d.status = "changed"
                self.db.add(past_d)

        self.db.commit()
        agent_log("Orchestrator", f"Meeting #{meeting.id} compiled and saved to SQLite successfully.")
        return meeting
