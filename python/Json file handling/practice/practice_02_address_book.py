"""
Address book domain model with JSON load/save support.

Demonstrates:
- Nested OOP mapping from JSON
- Validation and explicit error types
- Round-trip serialization (from_json / to_json)
- Encapsulation with read-only property access
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)

PRACTICE_DIR = Path(__file__).resolve().parent
DEFAULT_ADDRESS_BOOK_PATH = PRACTICE_DIR / "02_nested" / "address_book.json"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class AddressBookError(Exception):
    """Base exception for address book operations."""


class AddressBookValidationError(AddressBookError):
    """Raised when JSON structure or field values are invalid."""


class AddressBookParseError(AddressBookError):
    """Raised when JSON syntax is invalid."""


class AddressBookIOError(AddressBookError):
    """Raised when file operations fail."""


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _require_dict(value: Any, field_name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise AddressBookValidationError(
            f"Expected object for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise AddressBookValidationError(
            f"Expected array for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_non_empty_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AddressBookValidationError(
            f"Expected non-empty string for '{field_name}'"
        )
    return value.strip()


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class Phone:
    """Phone numbers for a contact."""

    __slots__ = ("_mobile", "_work")

    def __init__(self, mobile: str, work: str | None = None) -> None:
        self._mobile = _require_non_empty_string(mobile, "phones.mobile")
        if work is not None:
            work = _require_non_empty_string(work, "phones.work")
        self._work = work

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Phone:
        payload = _require_dict(data, "phones")
        return cls(mobile=payload["mobile"], work=payload.get("work"))

    def to_dict(self) -> dict[str, str]:
        result: dict[str, str] = {"mobile": self._mobile}
        if self._work is not None:
            result["work"] = self._work
        return result

    @property
    def mobile(self) -> str:
        return self._mobile

    @property
    def work(self) -> str | None:
        return self._work

    def __repr__(self) -> str:
        return f"Phone(mobile={self._mobile!r}, work={self._work!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Phone):
            return NotImplemented
        return self._mobile == other._mobile and self._work == other._work


class Address:
    """Postal address for a contact."""

    __slots__ = ("_line1", "_city", "_postcode", "_country")

    def __init__(self, line1: str, city: str, postcode: str, country: str) -> None:
        self._line1 = _require_non_empty_string(line1, "address.line1")
        self._city = _require_non_empty_string(city, "address.city")
        self._postcode = _require_non_empty_string(postcode, "address.postcode")
        self._country = _require_non_empty_string(country, "address.country")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Address:
        payload = _require_dict(data, "address")
        return cls(
            line1=payload["line1"],
            city=payload["city"],
            postcode=payload["postcode"],
            country=payload["country"],
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "line1": self._line1,
            "city": self._city,
            "postcode": self._postcode,
            "country": self._country,
        }

    @property
    def line1(self) -> str:
        return self._line1

    @property
    def city(self) -> str:
        return self._city

    @property
    def postcode(self) -> str:
        return self._postcode

    @property
    def country(self) -> str:
        return self._country

    def full_address(self) -> str:
        return f"{self._line1}, {self._city}, {self._postcode}, {self._country}"

    def __repr__(self) -> str:
        return f"Address(city={self._city!r}, country={self._country!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Address):
            return NotImplemented
        return self.to_dict() == other.to_dict()


class Contact:
    """A single person in the address book."""

    __slots__ = ("_name", "_phones", "_address")

    def __init__(self, name: str, phones: Phone, address: Address) -> None:
        self._name = _require_non_empty_string(name, "name")
        if not isinstance(phones, Phone):
            raise AddressBookValidationError("phones must be a Phone instance")
        if not isinstance(address, Address):
            raise AddressBookValidationError("address must be an Address instance")
        self._phones = phones
        self._address = address

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Contact:
        payload = _require_dict(data, "contact")
        try:
            return cls(
                name=payload["name"],
                phones=Phone.from_dict(payload["phones"]),
                address=Address.from_dict(payload["address"]),
            )
        except KeyError as exc:
            raise AddressBookValidationError(
                f"Missing required contact field: {exc.args[0]}"
            ) from exc

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self._name,
            "phones": self._phones.to_dict(),
            "address": self._address.to_dict(),
        }

    @property
    def name(self) -> str:
        return self._name

    @property
    def phones(self) -> Phone:
        return self._phones

    @property
    def address(self) -> Address:
        return self._address

    def __repr__(self) -> str:
        return f"Contact(name={self._name!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Contact):
            return NotImplemented
        return self.to_dict() == other.to_dict()


class AddressBook:
    """Collection of contacts owned by one person."""

    __slots__ = ("_owner", "_contacts")

    def __init__(self, owner: str, contacts: list[Contact]) -> None:
        self._owner = _require_non_empty_string(owner, "owner")
        if not isinstance(contacts, list):
            raise AddressBookValidationError("contacts must be a list")
        for index, contact in enumerate(contacts):
            if not isinstance(contact, Contact):
                raise AddressBookValidationError(
                    f"contacts[{index}] must be a Contact instance"
                )
        self._contacts = list(contacts)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AddressBook:
        payload = _require_dict(data, "address_book")
        try:
            owner = payload["owner"]
            raw_contacts = _require_list(payload["contacts"], "contacts")
        except KeyError as exc:
            raise AddressBookValidationError(
                f"Missing required address book field: {exc.args[0]}"
            ) from exc

        contacts = [Contact.from_dict(item) for item in raw_contacts]
        return cls(owner=owner, contacts=contacts)

    @classmethod
    def from_json(cls, path: Path | str) -> AddressBook:
        file_path = Path(path)
        logger.info("Loading address book from %s", file_path)

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise AddressBookIOError(f"File not found: {file_path}") from exc
        except OSError as exc:
            raise AddressBookIOError(
                f"Unable to read file: {file_path}"
            ) from exc

        if not raw_text.strip():
            raise AddressBookParseError(f"{file_path.name} is empty")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise AddressBookParseError(
                f"Invalid JSON in {file_path.name}: {exc.msg}"
            ) from exc

        return cls.from_dict(data)

    def to_dict(self) -> dict[str, Any]:
        return {
            "owner": self._owner,
            "contacts": [contact.to_dict() for contact in self._contacts],
        }

    def to_json(self, path: Path | str, *, indent: int = 2) -> None:
        file_path = Path(path)
        logger.info("Writing address book to %s", file_path)

        try:
            file_path.write_text(
                json.dumps(self.to_dict(), indent=indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise AddressBookIOError(
                f"Unable to write file: {file_path}"
            ) from exc

    @property
    def owner(self) -> str:
        return self._owner

    @property
    def contacts(self) -> tuple[Contact, ...]:
        """Return an immutable view of contacts."""
        return tuple(self._contacts)

    def find_by_name(self, name: str) -> Contact | None:
        normalized = name.strip().casefold()
        for contact in self._contacts:
            if contact.name.casefold() == normalized:
                return contact
        return None

    def iter_contacts(self) -> Iterator[Contact]:
        yield from self._contacts

    def print_summary(self) -> None:
        print(f"Owner: {self._owner}")
        for contact in self._contacts:
            print(f"\nContact: {contact.name}")
            print(f"  Mobile: {contact.phones.mobile}")
            if contact.phones.work:
                print(f"  Work: {contact.phones.work}")
            print(f"  Address: {contact.address.full_address()}")

    def __repr__(self) -> str:
        return (
            f"AddressBook(owner={self._owner!r}, "
            f"contacts={len(self._contacts)})"
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AddressBook):
            return NotImplemented
        return self.to_dict() == other.to_dict()


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
    )


def main() -> None:
    configure_logging()
    book = AddressBook.from_json(DEFAULT_ADDRESS_BOOK_PATH)
    book.print_summary()

    export_path = PRACTICE_DIR / "02_nested" / "address_book_export.json"
    book.to_json(export_path)
    logger.info("Exported copy to %s", export_path)


if __name__ == "__main__":
    main()
