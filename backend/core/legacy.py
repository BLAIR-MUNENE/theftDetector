from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from django.conf import settings


SETTINGS_PATH = settings.REPO_ROOT / "settings.json"
SETTINGS_EXAMPLE_PATH = settings.REPO_ROOT / "settings.example.json"
LEGACY_DB_PATH = settings.REPO_ROOT / "theft_detection.db"
USE_LEGACY_READS = settings.__dict__.get("USE_LEGACY_READS", False)


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def save_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_runtime_settings() -> dict[str, Any]:
    default_payload = load_json(SETTINGS_EXAMPLE_PATH, {})
    current_payload = load_json(SETTINGS_PATH, {})
    if not current_payload and default_payload:
        save_json(SETTINGS_PATH, default_payload)
        current_payload = default_payload
    return current_payload if isinstance(current_payload, dict) else {}


def save_runtime_settings(payload: dict[str, Any]) -> None:
    save_json(SETTINGS_PATH, payload)


def legacy_db_rows(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    if not LEGACY_DB_PATH.exists():
        return []
    conn = sqlite3.connect(str(LEGACY_DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    except sqlite3.Error:
        return []
    finally:
        conn.close()


def use_legacy_reads() -> bool:
    return bool(USE_LEGACY_READS)
