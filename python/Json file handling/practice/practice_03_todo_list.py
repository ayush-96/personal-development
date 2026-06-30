"""
Todo list domain model for JSON array practice.

Demonstrates:
- Array of objects parsing
- Aggregate root (TodoList) vs item (TodoItem)
- Validation, filtering, and round-trip serialization
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_TODO_LIST_PATH = BASE_DIR / "03_arrays" / "todo_list.json"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class TodoListError(Exception):
    """Base exception for todo list operations."""


class TodoValidationError(TodoListError):
    """Raised when item structure or field values are invalid."""


class TodoParseError(TodoListError):
    """Raised when JSON syntax is invalid or the file is empty."""


class TodoIOError(TodoListError):
    """Raised when file operations fail."""


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _require_positive_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TodoValidationError(
            f"Expected integer for '{field_name}', got {type(value).__name__}"
        )
    if value <= 0:
        raise TodoValidationError(
            f"Expected positive integer for '{field_name}', got {value}"
        )
    return value


def _require_non_empty_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise TodoValidationError(
            f"Expected non-empty string for '{field_name}'"
        )
    return value.strip()


def _require_bool(value: Any, field_name: str) -> bool:
    if not isinstance(value, bool):
        raise TodoValidationError(
            f"Expected boolean for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise TodoValidationError(
            f"Expected list for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_dict(value: Any, field_name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise TodoValidationError(
            f"Expected object for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_string_list(value: Any, field_name: str) -> tuple[str, ...]:
    items = _require_list(value, field_name)
    result: list[str] = []
    for index, item in enumerate(items):
        result.append(_require_non_empty_string(item, f"{field_name}[{index}]"))
    return tuple(result)


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class TodoItem:
    """Single todo item."""

    __slots__ = ("_id", "_task", "_completed", "_priority", "_tags")

    def __init__(
        self,
        id: int,
        task: str,
        completed: bool,
        priority: str,
        tags: tuple[str, ...],
    ) -> None:
        self._id = _require_positive_int(id, "id")
        self._task = _require_non_empty_string(task, "task")
        self._completed = _require_bool(completed, "completed")
        self._priority = _require_non_empty_string(priority, "priority")
        self._tags = tags

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> TodoItem:
        payload = _require_dict(data, "todo_item")
        try:
            return cls(
                id=payload["id"],
                task=payload["task"],
                completed=payload["completed"],
                priority=payload["priority"],
                tags=_require_string_list(payload["tags"], "tags"),
            )
        except KeyError as exc:
            raise TodoValidationError(
                f"Missing required todo field: {exc.args[0]}"
            ) from exc

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self._id,
            "task": self._task,
            "completed": self._completed,
            "priority": self._priority,
            "tags": list(self._tags),
        }

    @property
    def id(self) -> int:
        return self._id

    @property
    def task(self) -> str:
        return self._task

    @property
    def completed(self) -> bool:
        return self._completed

    @property
    def priority(self) -> str:
        return self._priority

    @property
    def tags(self) -> tuple[str, ...]:
        return self._tags

    def __repr__(self) -> str:
        status = "done" if self._completed else "pending"
        return f"TodoItem(id={self._id}, task={self._task!r}, {status})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TodoItem):
            return NotImplemented
        return self.to_dict() == other.to_dict()


class TodoList:
    """Aggregate root for a list of todo items loaded from JSON."""

    __slots__ = ("_items",)

    def __init__(self, items: list[TodoItem]) -> None:
        if not items:
            raise TodoValidationError("Todo list must contain at least one item")
        self._items = list(items)
        self._validate_unique_ids()

    def _validate_unique_ids(self) -> None:
        seen: set[int] = set()
        for item in self._items:
            if item.id in seen:
                raise TodoValidationError(f"Duplicate todo id: {item.id}")
            seen.add(item.id)

    @classmethod
    def from_dict(cls, data: list[dict[str, Any]]) -> TodoList:
        raw_items = _require_list(data, "todo_list")
        if not raw_items:
            raise TodoValidationError("Expected a non-empty todo list")
        items = [TodoItem.from_dict(item) for item in raw_items]
        return cls(items)

    @classmethod
    def from_json(cls, path: Path | str) -> TodoList:
        file_path = Path(path)
        logger.info("Loading todo list from %s", file_path)

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise TodoIOError(f"File not found: {file_path}") from exc
        except OSError as exc:
            raise TodoIOError(f"Unable to read file: {file_path}") from exc

        if not raw_text.strip():
            raise TodoParseError(f"{file_path.name} is empty")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise TodoParseError(
                f"Invalid JSON in {file_path.name}: {exc.msg}"
            ) from exc

        return cls.from_dict(data)

    def to_dict(self) -> list[dict[str, Any]]:
        return [item.to_dict() for item in self._items]

    def to_json(self, path: Path | str, *, indent: int = 2) -> None:
        file_path = Path(path)
        logger.info("Writing todo list to %s", file_path)
        try:
            file_path.write_text(
                json.dumps(self.to_dict(), indent=indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise TodoIOError(f"Unable to write file: {file_path}") from exc

    @property
    def items(self) -> tuple[TodoItem, ...]:
        return tuple(self._items)

    def completed_items(self) -> tuple[TodoItem, ...]:
        return tuple(item for item in self._items if item.completed)

    def pending_items(self) -> tuple[TodoItem, ...]:
        return tuple(item for item in self._items if not item.completed)

    def filter_by_priority(self, priority: str) -> tuple[TodoItem, ...]:
        normalized = priority.strip().casefold()
        return tuple(
            item for item in self._items
            if item.priority.casefold() == normalized
        )

    def find_by_id(self, item_id: int) -> TodoItem | None:
        for item in self._items:
            if item.id == item_id:
                return item
        return None

    def iter_items(self) -> Iterator[TodoItem]:
        yield from self._items

    def print_summary(self) -> None:
        print(f"Total: {len(self._items)}")
        print(f"Completed: {len(self.completed_items())}")
        print(f"Pending: {len(self.pending_items())}")
        print("\nAll items:")
        for item in self._items:
            status = "[x]" if item.completed else "[ ]"
            tags = ", ".join(item.tags)
            print(f"  {status} #{item.id} ({item.priority}) {item.task}  [{tags}]")

    def __repr__(self) -> str:
        return f"TodoList(items={len(self._items)})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TodoList):
            return NotImplemented
        return self.to_dict() == other.to_dict()


# ---------------------------------------------------------------------------
# Application entry point
# ---------------------------------------------------------------------------


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")


def run(path: Path = DEFAULT_TODO_LIST_PATH) -> TodoList:
    """Load, display, and export a todo list."""
    todo_list = TodoList.from_json(path)
    print(type(todo_list))
    todo_list.print_summary()

    export_path = BASE_DIR / "03_arrays" / "todo_list_export.json"
    todo_list.to_json(export_path)
    logger.info("Exported copy to %s", export_path)

    return todo_list


def main() -> int:
    configure_logging()
    try:
        run()
    except TodoListError as exc:
        logger.error("%s", exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
