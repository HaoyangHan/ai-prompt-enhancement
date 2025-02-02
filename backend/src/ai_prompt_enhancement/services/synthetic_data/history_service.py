import json
import os
from loguru import logger
from datetime import datetime
from typing import List, Optional, Dict, Any
from ...schemas.synthetic_data_history import (
    SyntheticDataHistoryEntry,
    SyntheticDataHistorySession,
    SyntheticDataHistoryInput,
    SyntheticDataHistoryOutput
)

logger = logger.bind(service="history")

class SyntheticDataHistoryService:
    def __init__(self, history_dir: str = "data/history"):
        self.history_dir = history_dir
        self.entries_file = os.path.join(history_dir, "synthetic_data_entries.json")
        self.sessions_file = os.path.join(history_dir, "synthetic_data_sessions.json")
        self._ensure_history_files()
        logger.info("History service initialized")

    def _ensure_history_files(self):
        """Ensure history files exist and are properly initialized."""
        os.makedirs(self.history_dir, exist_ok=True)
        
        if not os.path.exists(self.entries_file):
            logger.info("Creating new history entries file at: {}", self.entries_file)
            with open(self.entries_file, 'w') as f:
                json.dump([], f)
        
        if not os.path.exists(self.sessions_file):
            logger.info("Creating new history sessions file at: {}", self.sessions_file)
            with open(self.sessions_file, 'w') as f:
                json.dump([], f)

    def _load_entries(self) -> List[Dict]:
        """Load all history entries."""
        try:
            with open(self.entries_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error("Error loading history entries: {}", str(e))
            return []

    def _save_entries(self, entries: List[Dict]):
        """Save all history entries."""
        try:
            with open(self.entries_file, 'w') as f:
                json.dump(entries, f, indent=2)
            logger.debug("Successfully saved {} history entries", len(entries))
        except Exception as e:
            logger.error("Error saving history entries: {}", str(e))

    def _load_sessions(self) -> List[Dict]:
        """Load all history sessions."""
        try:
            with open(self.sessions_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error("Error loading history sessions: {}", str(e))
            return []

    def _save_sessions(self, sessions: List[Dict]):
        """Save all history sessions."""
        try:
            with open(self.sessions_file, 'w') as f:
                json.dump(sessions, f, indent=2)
            logger.debug("Successfully saved {} history sessions", len(sessions))
        except Exception as e:
            logger.error("Error saving history sessions: {}", str(e))

    def add_entry(self, template: str, model: str, batch_size: int,
                 generated_items: List[Dict[str, Any]], generation_time: float,
                 is_cached: bool, session_id: Optional[str] = None,
                 additional_instructions: Optional[str] = None,
                 reference_content: Optional[str] = None) -> None:
        """Add a new entry to the history."""
        try:
            entry = {
                "id": f"{int(datetime.now().timestamp())}.{int(generation_time * 1000)}",
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id,
                "input": {
                    "template": template,
                    "model": model,
                    "batch_size": batch_size,
                    "additional_instructions": additional_instructions,
                    "reference_content": reference_content
                },
                "output": {
                    "generated_items": generated_items,
                    "generation_time": generation_time,
                    "is_cached": is_cached,
                    "cached_at": datetime.now().isoformat() if is_cached else None
                },
                "type": "synthetic",
                "tags": [],
                "notes": None
            }
            
            try:
                with open(self.entries_file, 'r') as f:
                    history = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                logger.warning("History file corrupted or missing, creating new")
                history = []
            
            history.append(entry)
            
            with open(self.entries_file, 'w') as f:
                json.dump(history, f, indent=2)
            
            logger.info(f"Added history entry: {entry['id']}")
            
        except Exception as e:
            logger.error(f"Error adding history entry: {str(e)}")
            raise

    def create_session(self, name: str, description: Optional[str] = None) -> SyntheticDataHistorySession:
        """Create a new session."""
        try:
            session = SyntheticDataHistorySession(
                session_id=str(datetime.now().timestamp()),
                name=name,
                description=description
            )

            sessions = self._load_sessions()
            sessions.append(session.model_dump())
            self._save_sessions(sessions)
            logger.info("Created new session with ID: {}", session.session_id)

            return session
        except Exception as e:
            logger.error("Error creating session: {}", str(e))
            raise

    def _add_entry_to_session(self, entry_id: str, session_id: str):
        """Add an entry to a session."""
        sessions = self._load_sessions()
        for session in sessions:
            if session["session_id"] == session_id:
                session["entries"].append(entry_id)
                session["updated_at"] = datetime.now().isoformat()
                self._save_sessions(sessions)
                logger.debug("Added entry {} to session {}", entry_id, session_id)
                break

    def get_entries(self, 
                   session_id: Optional[str] = None, 
                   type: Optional[str] = None,
                   limit: int = 100) -> List[SyntheticDataHistoryEntry]:
        """Get history entries with optional filtering."""
        try:
            entries = self._load_entries()
            
            if session_id:
                entries = [e for e in entries if e.get("session_id") == session_id]
            if type:
                entries = [e for e in entries if e.get("type") == type]
            
            result = [SyntheticDataHistoryEntry(**e) for e in entries[-limit:]]
            logger.debug("Retrieved {} history entries", len(result))
            return result
        except Exception as e:
            logger.error("Error getting history entries: {}", str(e))
            return []

    def get_sessions(self, limit: int = 100) -> List[SyntheticDataHistorySession]:
        """Get all sessions."""
        try:
            sessions = self._load_sessions()
            result = [SyntheticDataHistorySession(**s) for s in sessions[-limit:]]
            logger.debug("Retrieved {} sessions", len(result))
            return result
        except Exception as e:
            logger.error("Error getting sessions: {}", str(e))
            return []

    def delete_entry(self, entry_id: str):
        """Delete a history entry."""
        try:
            entries = self._load_entries()
            original_count = len(entries)
            entries = [e for e in entries if e["id"] != entry_id]
            self._save_entries(entries)
            logger.info("Deleted entry {}", entry_id)

            # Remove from any sessions
            sessions = self._load_sessions()
            for session in sessions:
                if entry_id in session["entries"]:
                    session["entries"].remove(entry_id)
                    logger.debug("Removed entry {} from session {}", entry_id, session["session_id"])
            self._save_sessions(sessions)
        except Exception as e:
            logger.error("Error deleting entry: {}", str(e))
            raise

    def delete_session(self, session_id: str):
        """Delete a session and optionally its entries."""
        try:
            sessions = self._load_sessions()
            sessions = [s for s in sessions if s["session_id"] != session_id]
            self._save_sessions(sessions)
            logger.info("Deleted session {}", session_id)
        except Exception as e:
            logger.error("Error deleting session: {}", str(e))
            raise

    def update_entry_tags(self, entry_id: str, tags: List[str]):
        """Update tags for a history entry."""
        try:
            entries = self._load_entries()
            for entry in entries:
                if entry["id"] == entry_id:
                    entry["tags"] = tags
                    break
            self._save_entries(entries)
            logger.info("Updated tags for entry {}", entry_id)
        except Exception as e:
            logger.error("Error updating entry tags: {}", str(e))
            raise

    def update_entry_notes(self, entry_id: str, notes: str):
        """Update notes for a history entry."""
        try:
            entries = self._load_entries()
            for entry in entries:
                if entry["id"] == entry_id:
                    entry["notes"] = notes
                    break
            self._save_entries(entries)
            logger.info("Updated notes for entry {}", entry_id)
        except Exception as e:
            logger.error("Error updating entry notes: {}", str(e))
            raise

# Global instance
history_service = SyntheticDataHistoryService()

__all__ = ['history_service'] 