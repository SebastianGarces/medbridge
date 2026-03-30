"""Lookup service for MedBridge exercise videos."""

import json
import re
from pathlib import Path
from typing import Optional

_DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "medbridge_exercises.json"
_library: Optional[dict] = None


def _load() -> dict:
    global _library
    if _library is None:
        with open(_DATA_PATH) as f:
            data = json.load(f)
        _library = {ex["token"]: ex for ex in data["exercises"] if ex.get("token")}
    return _library


def get_by_token(token: str) -> Optional[dict]:
    """Look up an exercise video by its token."""
    return _load().get(token)


def get_all() -> list[dict]:
    """Return all exercises with video tokens."""
    return list(_load().values())


def search_by_name(query: str) -> list[dict]:
    """Fuzzy search exercises by name (case-insensitive substring)."""
    q = query.lower()
    return [ex for ex in _load().values() if q in ex["name"].lower()]


# Regex for [exercise:TOKEN] markers in message text
_EXERCISE_TAG_RE = re.compile(r"\[exercise:([a-z0-9]+)\]")


def extract_tokens(text: str) -> list[str]:
    """Extract exercise tokens from [exercise:TOKEN] markers in text."""
    return _EXERCISE_TAG_RE.findall(text)


def strip_markers(text: str) -> str:
    """Remove [exercise:TOKEN] markers from text."""
    return _EXERCISE_TAG_RE.sub("", text).strip()
