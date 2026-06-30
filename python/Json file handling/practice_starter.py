#!/usr/bin/env python3
"""
Starter script for JSON file handling practice.

Run from this folder:
    python practice_starter.py
"""

from __future__ import annotations

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PRACTICE_DIR = BASE_DIR / "practice"


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_practice_files() -> list[Path]:
    return sorted(
        path
        for path in PRACTICE_DIR.rglob("*")
        if path.is_file() and path.suffix in {".json", ".ndjson"}
    )


def try_load_all() -> None:
    print("=== Valid JSON files ===")
    for path in list_practice_files():
        if "06_invalid" in path.parts:
            continue
        try:
            data = load_json(path)
            kind = type(data).__name__
            print(f"OK  {path.relative_to(BASE_DIR)} ({kind})")
        except json.JSONDecodeError as exc:
            print(f"ERR {path.relative_to(BASE_DIR)} -> {exc.msg}")

    print("\n=== Invalid JSON files (expected failures) ===")
    invalid_dir = PRACTICE_DIR / "06_invalid"
    for path in sorted(invalid_dir.glob("*.json")):
        try:
            load_json(path)
            print(f"UNEXPECTED OK  {path.relative_to(BASE_DIR)}")
        except json.JSONDecodeError as exc:
            print(f"EXPECTED ERR  {path.relative_to(BASE_DIR)} -> {exc.msg}")


def read_ndjson(path: Path) -> list[dict]:
    events: list[dict] = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            line = line.strip()
            if not line:
                continue
            events.append(json.loads(line))
    return events


if __name__ == "__main__":
    try_load_all()

    ndjson_path = PRACTICE_DIR / "07_ndjson" / "events.ndjson"
    events = read_ndjson(ndjson_path)
    print(f"\nLoaded {len(events)} NDJSON events; first event type is: {events[0]['event']}")
