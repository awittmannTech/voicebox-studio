"""
Hotkey recording CRUD operations.
"""

from sqlalchemy.orm import Session
from pathlib import Path
import uuid
from typing import Optional, List

from .database import HotkeyRecording
from . import config


def create_recording(db: Session, audio_data: bytes, duration: float) -> HotkeyRecording:
    """Create a new hotkey recording."""
    recording_id = str(uuid.uuid4())

    # Save audio file
    hotkey_dir = config.get_data_dir() / "hotkey_recordings"
    hotkey_dir.mkdir(parents=True, exist_ok=True)
    audio_path = hotkey_dir / f"{recording_id}.wav"

    with open(audio_path, "wb") as f:
        f.write(audio_data)

    # Create database entry
    recording = HotkeyRecording(
        id=recording_id,
        audio_path=str(audio_path),
        duration=duration,
    )
    db.add(recording)
    db.commit()
    db.refresh(recording)

    return recording


def list_recordings(db: Session, skip: int = 0, limit: int = 50) -> tuple[List[HotkeyRecording], int]:
    """List hotkey recordings, newest first."""
    total = db.query(HotkeyRecording).count()
    recordings = (
        db.query(HotkeyRecording)
        .order_by(HotkeyRecording.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return recordings, total


def get_recording(db: Session, recording_id: str) -> Optional[HotkeyRecording]:
    """Get a single hotkey recording by ID."""
    return db.query(HotkeyRecording).filter(HotkeyRecording.id == recording_id).first()


def delete_recording(db: Session, recording_id: str) -> bool:
    """Delete a hotkey recording and its audio file."""
    recording = get_recording(db, recording_id)
    if not recording:
        return False

    # Delete audio file if it exists
    audio_path = Path(recording.audio_path)
    if audio_path.exists():
        audio_path.unlink()

    # Delete database entry
    db.delete(recording)
    db.commit()

    return True


def update_transcription(db: Session, recording_id: str, transcription: str) -> Optional[HotkeyRecording]:
    """Update the transcription of a hotkey recording."""
    recording = get_recording(db, recording_id)
    if not recording:
        return None

    recording.transcription = transcription
    db.commit()
    db.refresh(recording)

    return recording


def mark_as_processed(db: Session, recording_id: str) -> Optional[HotkeyRecording]:
    """Mark a hotkey recording as processed (converted to profile)."""
    recording = get_recording(db, recording_id)
    if not recording:
        return None

    recording.is_processed = True
    db.commit()
    db.refresh(recording)

    return recording
