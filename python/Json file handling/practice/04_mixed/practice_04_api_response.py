"""
Paginated API response domain model with composable validation.

Demonstrates:
- Composite response (data + meta + links)
- Validator classes composed via ValidationPipeline
- Typed errors, JSON round-trip, and deduplication by user id
"""

from __future__ import annotations

import json
import logging
import sys
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_API_RESPONSE_PATH = BASE_DIR / "api_response_paginated.json"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class APIResponseError(Exception):
    """Base exception for paginated API response operations."""


class APIResponseValidationError(APIResponseError):
    """Raised when JSON structure, types, or cross-field rules are invalid."""


class APIResponseParseError(APIResponseError):
    """Raised when JSON syntax is invalid or the file is empty."""


class APIResponseIOError(APIResponseError):
    """Raised when file operations fail."""


# ---------------------------------------------------------------------------
# Composable validators
# ---------------------------------------------------------------------------


class Validator(ABC):
    """Abstract base for field validation strategies."""

    @abstractmethod
    def validate(self, value: Any, field_name: str) -> Any:
        ...


class NonEmptyStringValidator(Validator):
    def validate(self, value: Any, field_name: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise APIResponseValidationError(
                f"Expected non-empty string for '{field_name}'"
            )
        return value.strip()


class OptionalStringValidator(Validator):
    """Accepts None or a non-empty string."""

    def __init__(self) -> None:
        self._string_validator = NonEmptyStringValidator()

    def validate(self, value: Any, field_name: str) -> str | None:
        if value is None:
            return None
        return self._string_validator.validate(value, field_name)


class PositiveIntValidator(Validator):
    def validate(self, value: Any, field_name: str) -> int:
        if isinstance(value, bool) or not isinstance(value, int):
            raise APIResponseValidationError(
                f"Expected integer for '{field_name}', got {type(value).__name__}"
            )
        if value <= 0:
            raise APIResponseValidationError(
                f"Expected positive integer for '{field_name}', got {value}"
            )
        return value


class DictValidator(Validator):
    def validate(self, value: Any, field_name: str) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise APIResponseValidationError(
                f"Expected object for '{field_name}', got {type(value).__name__}"
            )
        return value


class ListValidator(Validator):
    def validate(self, value: Any, field_name: str) -> list[Any]:
        if not isinstance(value, list):
            raise APIResponseValidationError(
                f"Expected list for '{field_name}', got {type(value).__name__}"
            )
        return value


class ValidationPipeline(Validator):
    """Composition: run validators in sequence for one field."""

    def __init__(self, *validators: Validator) -> None:
        self._validators = validators

    def validate(self, value: Any, field_name: str) -> Any:
        for validator in self._validators:
            value = validator.validate(value, field_name)
        return value

    def run(self, value: Any, field_name: str) -> Any:
        """Alias for validate(); kept for readability at call sites."""
        return self.validate(value, field_name)


# Validator registry — single place to register and look up field rules
VALIDATOR_REGISTRY: dict[str, ValidationPipeline] = {
    "string": ValidationPipeline(NonEmptyStringValidator()),
    "optional_string": ValidationPipeline(OptionalStringValidator()),
    "positive_int": ValidationPipeline(PositiveIntValidator()),
    "dict": ValidationPipeline(DictValidator()),
    "list": ValidationPipeline(ListValidator()),
}


def validate_field(rule: str, value: Any, field_name: str) -> Any:
    """Run a named validation rule from the registry."""
    try:
        return VALIDATOR_REGISTRY[rule].validate(value, field_name)
    except KeyError as exc:
        raise APIResponseValidationError(
            f"Unknown validation rule: {rule!r}"
        ) from exc


def _require_field(payload: dict[str, Any], field_name: str) -> Any:
    try:
        return payload[field_name]
    except KeyError as exc:
        raise APIResponseValidationError(
            f"Missing required field: {field_name}"
        ) from exc


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class UserRecord:
    """Single user entry in the paginated data array."""

    __slots__ = ("_id", "_name", "_role")

    def __init__(self, id: str, name: str, role: str) -> None:
        self._id = validate_field("string", id, "id")
        self._name = validate_field("string", name, "name")
        self._role = validate_field("string", role, "role")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> UserRecord:
        payload = validate_field("dict", data, "user_record")
        return cls(
            id=_require_field(payload, "id"),
            name=_require_field(payload, "name"),
            role=_require_field(payload, "role"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {"id": self._id, "name": self._name, "role": self._role}

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def role(self) -> str:
        return self._role

    def __repr__(self) -> str:
        return f"UserRecord(id={self._id!r}, name={self._name!r}, role={self._role!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, UserRecord):
            return NotImplemented
        return self._id == other._id

    def __hash__(self) -> int:
        return hash(self._id)


class PaginationMeta:
    """Pagination metadata block."""

    __slots__ = ("_page", "_page_size", "_total_items", "_total_pages")

    def __init__(
        self,
        page: int,
        page_size: int,
        total_items: int,
        total_pages: int,
    ) -> None:
        self._page = validate_field("positive_int", page, "page")
        self._page_size = validate_field("positive_int", page_size, "page_size")
        self._total_items = validate_field("positive_int", total_items, "total_items")
        self._total_pages = validate_field("positive_int", total_pages, "total_pages")

        if self._page > self._total_pages:
            raise APIResponseValidationError(
                f"page ({self._page}) cannot exceed total_pages ({self._total_pages})"
            )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaginationMeta:
        payload = validate_field("dict", data, "meta")
        return cls(
            page=_require_field(payload, "page"),
            page_size=_require_field(payload, "page_size"),
            total_items=_require_field(payload, "total_items"),
            total_pages=_require_field(payload, "total_pages"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "page": self._page,
            "page_size": self._page_size,
            "total_items": self._total_items,
            "total_pages": self._total_pages,
        }

    @property
    def page(self) -> int:
        return self._page

    @property
    def page_size(self) -> int:
        return self._page_size

    @property
    def total_items(self) -> int:
        return self._total_items

    @property
    def total_pages(self) -> int:
        return self._total_pages

    def __repr__(self) -> str:
        return (
            f"PaginationMeta(page={self._page}, page_size={self._page_size}, "
            f"total_items={self._total_items}, total_pages={self._total_pages})"
        )


class PaginationLinks:
    """HATEOAS-style links block."""

    __slots__ = ("_self", "_next", "_prev")

    def __init__(
        self,
        self_link: str,
        next_link: str | None,
        prev_link: str | None,
    ) -> None:
        self._self = validate_field("string", self_link, "self")
        self._next = validate_field("optional_string", next_link, "next")
        self._prev = validate_field("optional_string", prev_link, "prev")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaginationLinks:
        payload = validate_field("dict", data, "links")
        return cls(
            self_link=_require_field(payload, "self"),
            next_link=payload.get("next"),
            prev_link=payload.get("prev"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {"self": self._self, "next": self._next, "prev": self._prev}

    @property
    def self(self) -> str:
        return self._self

    @property
    def next(self) -> str | None:
        return self._next

    @property
    def prev(self) -> str | None:
        return self._prev

    def __repr__(self) -> str:
        return f"PaginationLinks(self={self._self!r}, next={self._next!r}, prev={self._prev!r})"


class PaginatedAPIResponse:
    """Root aggregate: paginated list of users with meta and links."""

    __slots__ = ("_data", "_meta", "_links")

    def __init__(self, data: list[UserRecord], meta: PaginationMeta, links: PaginationLinks) -> None:
        if not isinstance(meta, PaginationMeta):
            raise APIResponseValidationError(
                f"Expected PaginationMeta for 'meta', got {type(meta).__name__}"
            )
        if not isinstance(links, PaginationLinks):
            raise APIResponseValidationError(
                f"Expected PaginationLinks for 'links', got {type(links).__name__}"
            )

        self._data = list(data)
        self._meta = meta
        self._links = links

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaginatedAPIResponse:
        payload = validate_field("dict", data, "api_response")
        raw_data = validate_field("list", _require_field(payload, "data"), "data")
        return cls(
            data=[UserRecord.from_dict(item) for item in raw_data],
            meta=PaginationMeta.from_dict(_require_field(payload, "meta")),
            links=PaginationLinks.from_dict(_require_field(payload, "links")),
        )

    @classmethod
    def from_json(cls, path: Path | str) -> PaginatedAPIResponse:
        file_path = Path(path)
        logger.info("Loading API response from %s", file_path)

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise APIResponseIOError(f"File not found: {file_path}") from exc
        except OSError as exc:
            raise APIResponseIOError(f"Unable to read file: {file_path}") from exc

        if not raw_text.strip():
            raise APIResponseParseError(f"{file_path.name} is empty")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise APIResponseParseError(
                f"Invalid JSON in {file_path.name}: {exc.msg}"
            ) from exc

        return cls.from_dict(data)

    def to_dict(self) -> dict[str, Any]:
        return {
            "data": [item.to_dict() for item in self._data],
            "meta": self._meta.to_dict(),
            "links": self._links.to_dict(),
        }

    def to_json(self, path: Path | str, *, indent: int = 2) -> None:
        file_path = Path(path)
        logger.info("Writing API response to %s", file_path)
        try:
            file_path.write_text(
                json.dumps(self.to_dict(), indent=indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise APIResponseIOError(f"Unable to write file: {file_path}") from exc

    @property
    def data(self) -> tuple[UserRecord, ...]:
        return tuple(self._data)

    @property
    def meta(self) -> PaginationMeta:
        return self._meta

    @property
    def links(self) -> PaginationLinks:
        return self._links

    def get_item_by_id(self, item_id: str) -> UserRecord | None:
        for item in self._data:
            if item.id == item_id:
                return item
        return None

    def get_items_by_role(self, role: str) -> tuple[UserRecord, ...]:
        normalized = role.strip().casefold()
        return tuple(item for item in self._data if item.role.casefold() == normalized)

    def get_items_by_name(self, name: str) -> tuple[UserRecord, ...]:
        normalized = name.strip().casefold()
        return tuple(item for item in self._data if item.name.casefold() == normalized)

    def remove_duplicate_data_items(self) -> int:
        """Remove duplicates by id; returns number of items removed."""
        seen_ids: set[str] = set()
        unique_items: list[UserRecord] = []

        for item in self._data:
            if item.id in seen_ids:
                continue
            seen_ids.add(item.id)
            unique_items.append(item)

        removed_count = len(self._data) - len(unique_items)
        self._data = unique_items
        return removed_count

    def print_summary(self, *, title: str = "API Response Summary") -> None:
        line = "=" * 52
        print(line)
        print(title.center(52))
        print(line)

        print(f"\nUsers ({len(self._data)} unique)")
        print("-" * 52)
        print(f"  {'ID':<12} {'Name':<18} {'Role':<10}")
        for item in self._data:
            print(f"  {item.id:<12} {item.name:<18} {item.role:<10}")

        print("\nPagination")
        print("-" * 52)
        print(f"  Page:        {self._meta.page} / {self._meta.total_pages}")
        print(f"  Page size:   {self._meta.page_size}")
        print(f"  Total items: {self._meta.total_items}")

        print("\nLinks")
        print("-" * 52)
        print(f"  Self:  {self._links.self}")
        print(f"  Next:  {self._links.next or '(none)'}")
        print(f"  Prev:  {self._links.prev or '(none)'}")
        print()

    def __repr__(self) -> str:
        return f"PaginatedAPIResponse(users={len(self._data)})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, PaginatedAPIResponse):
            return NotImplemented
        return self.to_dict() == other.to_dict()


# Backward-compatible aliases (older naming in tests / notes)
StoreInventoryValidationError = APIResponseValidationError
StoreInventoryDataItem = UserRecord
StoreInventoryMeta = PaginationMeta
StoreInventoryLinks = PaginationLinks
StoreInventoryAPIResponse = PaginatedAPIResponse
STORE_INVENTORY_PATH = DEFAULT_API_RESPONSE_PATH


# ---------------------------------------------------------------------------
# Application entry point
# ---------------------------------------------------------------------------


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
    )


def run(path: Path = DEFAULT_API_RESPONSE_PATH) -> PaginatedAPIResponse:
    """Load, display, deduplicate, and export a paginated API response."""
    api_response = PaginatedAPIResponse.from_json(path)
    logger.info("API response loaded (%d items)", len(api_response.data))

    print("\n--- Before deduplication ---")
    api_response.print_summary(title="Before Deduplication")

    removed = api_response.remove_duplicate_data_items()
    logger.info("Removed %d duplicate item(s)", removed)

    print("--- After deduplication ---")
    api_response.print_summary(title="After Deduplication")

    export_path = BASE_DIR / "api_response_export.json"
    api_response.to_json(export_path)
    logger.info("Exported copy to %s", export_path)

    return api_response


def main() -> int:
    configure_logging()
    try:
        run()
    except APIResponseError as exc:
        logger.error("%s", exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
