import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from ...models.synthetic_data import GenerationRecord

logger = logging.getLogger(__name__)

class SyntheticDataHistory:
    def __init__(self):
        """Initialize the history service."""
        self.history_dir = Path("data/synthetic_data_history")
        self.history_dir.mkdir(parents=True, exist_ok=True)
        logger.info("[HISTORY] Initialized directory: %s", self.history_dir)

    def save_record(
        self,
        template: str,
        model: str,
        data: List[Dict[str, Any]],
        generation_time: float,
        is_cached: bool = False,
        cached_at: Optional[str] = None,
        reference_content: Optional[str] = None
    ) -> GenerationRecord:
        """Save a generation record to history."""
        try:
            logger.debug("[HISTORY] Saving new record")
            timestamp = datetime.now()
            record_id = f"gen_{int(timestamp.timestamp() * 1000)}"
            
            record = {
                "id": record_id,
                "timestamp": timestamp.isoformat(),
                "template": template,
                "model": model,
                "data": data,
                "generation_time": generation_time,
                "is_cached": is_cached,
                "cached_at": cached_at
            }
            
            if reference_content:
                record["reference_content"] = reference_content
            
            filename = f"generation_{timestamp.strftime('%Y%m%d_%H%M%S_%f')}.json"
            file_path = self.history_dir / filename
            
            with file_path.open('w', encoding='utf-8') as f:
                json.dump(record, f, indent=2, ensure_ascii=False)
            
            logger.info("[HISTORY] Saved record: %s", record_id)
            return record
            
        except Exception as e:
            logger.error("[HISTORY] Error saving record: %s", str(e))
            raise
    
    def get_records(self, limit: Optional[int] = None) -> List[GenerationRecord]:
        """Get generation history records, optionally limited to the most recent n records."""
        try:
            logger.debug("[HISTORY] Retrieving records (limit=%s)", limit)
            files = sorted(self.history_dir.glob("generation_*.json"), reverse=True)
            
            if limit:
                files = files[:limit]
            
            records = []
            for file in files:
                try:
                    with file.open('r', encoding='utf-8') as f:
                        record = json.load(f)
                        records.append(record)
                except Exception as e:
                    logger.error("[HISTORY] Error reading file %s: %s", file.name, str(e))
                    continue
            
            logger.info("[HISTORY] Retrieved %d records", len(records))
            return records
            
        except Exception as e:
            logger.error("[HISTORY] Error getting records: %s", str(e))
            return []
    
    def delete_record(self, record_id: str) -> bool:
        """Delete a specific record from history."""
        try:
            logger.info("[HISTORY] Deleting record: %s", record_id)
            files = self.history_dir.glob("generation_*.json")
            
            for file in files:
                try:
                    with file.open('r', encoding='utf-8') as f:
                        record = json.load(f)
                        if record.get("id") == record_id:
                            file.unlink()
                            logger.info("[HISTORY] Successfully deleted record: %s", record_id)
                            return True
                except Exception as e:
                    logger.error("[HISTORY] Error processing file %s: %s", file.name, str(e))
                    continue
            
            logger.warning("[HISTORY] Record not found: %s", record_id)
            return False
            
        except Exception as e:
            logger.error("[HISTORY] Error deleting record: %s", str(e))
            return False
    
    def clear_history(self) -> bool:
        """Clear all history records."""
        try:
            logger.info("[HISTORY] Clearing all records")
            files = list(self.history_dir.glob("generation_*.json"))
            count = 0
            
            for file in files:
                try:
                    file.unlink()
                    count += 1
                except Exception as e:
                    logger.error("[HISTORY] Error deleting file %s: %s", file.name, str(e))
            
            logger.info("[HISTORY] Successfully cleared %d records", count)
            return True
            
        except Exception as e:
            logger.error("[HISTORY] Error clearing history: %s", str(e))
            return False

# Global instance
history = SyntheticDataHistory() 