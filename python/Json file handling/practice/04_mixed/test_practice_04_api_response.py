"""Pytest tests for practice_04_api_response.py."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import pytest

PRACTICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PRACTICE_DIR))

from practice_04_api_response import (
    APIResponseParseError,
    APIResponseValidationError,
    NonEmptyStringValidator,
    PaginatedAPIResponse,
    PaginationMeta,
    ValidationPipeline,
    Validator,
    validate_field,
)

API_RESPONSE_PATH = PRACTICE_DIR / "api_response_paginated.json"


@pytest.fixture
def sample_api_response() -> dict:
    return {
        "data": [
            {"id": "usr-001", "name": "Alice Chen", "role": "admin"},
            {"id": "usr-002", "name": "Ben Patel", "role": "editor"},
            {"id": "usr-002", "name": "Ben Patel", "role": "editor"},
        ],
        "meta": {
            "page": 1,
            "page_size": 2,
            "total_items": 57,
            "total_pages": 29,
        },
        "links": {
            "self": "/api/v1/users?page=1",
            "next": "/api/v1/users?page=2",
            "prev": None,
        },
    }


@pytest.fixture
def api_response(sample_api_response: dict) -> PaginatedAPIResponse:
    return PaginatedAPIResponse.from_dict(sample_api_response)


def test_load_real_file_from_json() -> None:
    response = PaginatedAPIResponse.from_json(API_RESPONSE_PATH)
    assert len(response.data) == 3


def test_from_dict_parses_meta_and_links(api_response: PaginatedAPIResponse) -> None:
    assert api_response.meta.page == 1
    assert api_response.meta.total_items == 57
    assert api_response.links.prev is None
    assert api_response.links.next == "/api/v1/users?page=2"


def test_remove_duplicate_data_items(api_response: PaginatedAPIResponse) -> None:
    removed = api_response.remove_duplicate_data_items()
    assert removed == 1
    assert len(api_response.data) == 2
    assert [item.id for item in api_response.data] == ["usr-001", "usr-002"]


def test_get_item_by_id(api_response: PaginatedAPIResponse) -> None:
    item = api_response.get_item_by_id("usr-001")
    assert item is not None
    assert item.name == "Alice Chen"


def test_get_item_by_id_returns_none_when_missing(api_response: PaginatedAPIResponse) -> None:
    assert api_response.get_item_by_id("usr-999") is None


def test_missing_field_raises_validation_error(sample_api_response: dict) -> None:
    bad = {"data": [], "meta": sample_api_response["meta"]}
    with pytest.raises(APIResponseValidationError):
        PaginatedAPIResponse.from_dict(bad)


def test_to_dict_round_trip(api_response: PaginatedAPIResponse) -> None:
    api_response.remove_duplicate_data_items()
    reloaded = PaginatedAPIResponse.from_dict(api_response.to_dict())
    assert len(reloaded.data) == 2
    assert reloaded.meta.page == api_response.meta.page


def test_json_file_round_trip(api_response: PaginatedAPIResponse) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        export_path = Path(temp_dir) / "response.json"
        api_response.to_json(export_path)
        reloaded = PaginatedAPIResponse.from_json(export_path)
    assert reloaded == api_response


def test_empty_json_file_raises_parse_error() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        empty_path = Path(temp_dir) / "empty.json"
        empty_path.write_text("", encoding="utf-8")
        with pytest.raises(APIResponseParseError):
            PaginatedAPIResponse.from_json(empty_path)


def test_page_cannot_exceed_total_pages() -> None:
    with pytest.raises(APIResponseValidationError):
        PaginationMeta(page=30, page_size=2, total_items=57, total_pages=29)


def test_composable_string_validator_rejects_blank() -> None:
    with pytest.raises(APIResponseValidationError):
        validate_field("string", "   ", "name")


def test_unknown_validation_rule_raises() -> None:
    with pytest.raises(APIResponseValidationError, match="Unknown validation rule"):
        validate_field("not_a_rule", "value", "field")


def test_data_property_is_immutable_tuple(api_response: PaginatedAPIResponse) -> None:
    assert isinstance(api_response.data, tuple)


def test_validators_inherit_abc_base() -> None:
    validator = NonEmptyStringValidator()
    assert isinstance(validator, Validator)


def test_abstract_validator_cannot_be_instantiated() -> None:
    with pytest.raises(TypeError):
        Validator()  # type: ignore[abstract]
