"""Tests for practice_02_address_book.py (stdlib unittest — no extra deps)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

PRACTICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PRACTICE_DIR))

from practice_02_address_book import (
    Address,
    AddressBook,
    AddressBookParseError,
    AddressBookValidationError,
    Contact,
    Phone,
)


SAMPLE_CONTACT = {
    "name": "James O'Connor",
    "phones": {"mobile": "+353 87 123 4567"},
    "address": {
        "line1": "45 River Road",
        "city": "Dublin",
        "postcode": "D02 X285",
        "country": "Ireland",
    },
}

SAMPLE_BOOK = {
    "owner": "Ayush Agarwal",
    "contacts": [
        {
            "name": "Roshini Agarwal",
            "phones": {
                "mobile": "+44 7700 900123",
                "work": "+44 141 555 0100",
            },
            "address": {
                "line1": "12 University Avenue",
                "city": "Glasgow",
                "postcode": "G12 8QQ",
                "country": "United Kingdom",
            },
        },
        SAMPLE_CONTACT,
    ],
}


class PhoneTests(unittest.TestCase):
    def test_from_dict_without_work_phone(self) -> None:
        phone = Phone.from_dict({"mobile": "+1 555 0100"})
        self.assertEqual(phone.mobile, "+1 555 0100")
        self.assertIsNone(phone.work)

    def test_to_dict_omits_optional_work_phone(self) -> None:
        phone = Phone(mobile="+1 555 0100")
        self.assertEqual(phone.to_dict(), {"mobile": "+1 555 0100"})

    def test_rejects_empty_mobile(self) -> None:
        with self.assertRaises(AddressBookValidationError):
            Phone.from_dict({"mobile": "   "})


class ContactTests(unittest.TestCase):
    def test_from_dict_and_to_dict_round_trip(self) -> None:
        contact = Contact.from_dict(SAMPLE_CONTACT)
        self.assertEqual(contact.to_dict(), SAMPLE_CONTACT)

    def test_missing_name_raises_validation_error(self) -> None:
        bad_payload = dict(SAMPLE_CONTACT)
        del bad_payload["name"]
        with self.assertRaises(AddressBookValidationError):
            Contact.from_dict(bad_payload)


class AddressBookTests(unittest.TestCase):
    def test_load_real_file(self) -> None:
        path = PRACTICE_DIR / "02_nested" / "address_book.json"
        book = AddressBook.from_json(path)
        self.assertEqual(book.owner, "Ayush Agarwal")
        self.assertEqual(len(book.contacts), 2)

    def test_find_by_name_is_case_insensitive(self) -> None:
        book = AddressBook.from_dict(SAMPLE_BOOK)
        contact = book.find_by_name("james o'connor")
        self.assertIsNotNone(contact)
        assert contact is not None
        self.assertEqual(contact.phones.work, None)

    def test_contacts_property_is_immutable_view(self) -> None:
        book = AddressBook.from_dict(SAMPLE_BOOK)
        contacts = book.contacts
        self.assertIsInstance(contacts, tuple)
        self.assertEqual(len(contacts), 2)

    def test_json_round_trip(self) -> None:
        original = AddressBook.from_dict(SAMPLE_BOOK)

        with tempfile.TemporaryDirectory() as temp_dir:
            export_path = Path(temp_dir) / "book.json"
            original.to_json(export_path)
            reloaded = AddressBook.from_json(export_path)

        self.assertEqual(original, reloaded)

    def test_invalid_json_raises_parse_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            bad_path = Path(temp_dir) / "bad.json"
            bad_path.write_text("{not valid json", encoding="utf-8")
            with self.assertRaises(AddressBookParseError):
                AddressBook.from_json(bad_path)

    def test_empty_file_raises_parse_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            empty_path = Path(temp_dir) / "empty.json"
            empty_path.write_text("", encoding="utf-8")
            with self.assertRaises(AddressBookParseError):
                AddressBook.from_json(empty_path)

    def test_wrong_contacts_type_raises_validation_error(self) -> None:
        bad_book = {"owner": "Test", "contacts": "not-a-list"}
        with self.assertRaises(AddressBookValidationError):
            AddressBook.from_dict(bad_book)


class AddressTests(unittest.TestCase):
    def test_full_address(self) -> None:
        address = Address(
            line1="12 University Avenue",
            city="Glasgow",
            postcode="G12 8QQ",
            country="United Kingdom",
        )
        self.assertIn("Glasgow", address.full_address())


if __name__ == "__main__":
    unittest.main()
