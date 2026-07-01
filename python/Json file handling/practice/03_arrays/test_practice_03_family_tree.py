"""Tests for practice_03_family_tree.py (stdlib unittest — no extra deps)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

PRACTICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PRACTICE_DIR))

from practice_03_family_tree import (
    Child,
    FamilyTree,
    FamilyTreeParseError,
    FamilyTreeValidationError,
    Parent,
    PersonRegistry,
)

SAMPLE_TREE = {
    "family_name": "Nguyen",
    "generations": {
        "grandparents": [
            {"id": "gp-1", "name": "Lan Nguyen", "children": ["p-1", "p-2"]}
        ],
        "parents": [
            {
                "id": "p-1",
                "name": "Minh Nguyen",
                "spouse_id": "p-2",
                "children": ["c-1", "c-2"],
            },
            {
                "id": "p-2",
                "name": "Hoa Tran",
                "spouse_id": "p-1",
                "children": ["c-1", "c-2"],
            },
        ],
        "children": [
            {"id": "c-1", "name": "An Nguyen", "birth_year": 2010},
            {"id": "c-2", "name": "Bao Nguyen", "birth_year": 2013},
        ],
    },
}


class ChildTests(unittest.TestCase):
    def test_from_dict(self) -> None:
        child = Child.from_dict({"id": "c-1", "name": "An", "birth_year": 2010})
        self.assertEqual(child.name, "An")
        self.assertEqual(child.birth_year, 2010)


class PersonRegistryTests(unittest.TestCase):
    def test_resolves_child_ids_to_objects(self) -> None:
        tree = FamilyTree.from_dict(SAMPLE_TREE)
        parent = tree.parents[0]
        self.assertEqual(len(parent.children), 2)
        self.assertIsInstance(parent.children[0], Child)
        self.assertEqual(parent.children[0].id, "c-1")

    def test_unknown_child_id_raises(self) -> None:
        bad = dict(SAMPLE_TREE)
        bad["generations"] = dict(SAMPLE_TREE["generations"])
        bad["generations"]["parents"] = [
            {
                "id": "p-1",
                "name": "Minh",
                "spouse_id": "p-2",
                "children": ["c-missing"],
            }
        ]
        with self.assertRaises(FamilyTreeValidationError):
            FamilyTree.from_dict(bad)


class FamilyTreeTests(unittest.TestCase):
    def test_load_real_file(self) -> None:
        path = PRACTICE_DIR / "02_nested" / "family_tree.json"
        tree = FamilyTree.from_json(path)
        self.assertEqual(tree.family_name, "Nguyen")
        self.assertEqual(len(tree.children), 2)

    def test_parent_children_are_objects_not_strings(self) -> None:
        tree = FamilyTree.from_dict(SAMPLE_TREE)
        for parent in tree.parents:
            for child in parent.children:
                self.assertIsInstance(child, Child)
                self.assertNotIsInstance(child, str)

    def test_grandparent_children_are_parent_objects(self) -> None:
        tree = FamilyTree.from_dict(SAMPLE_TREE)
        gp = tree.grandparents[0]
        self.assertEqual(len(gp.children), 2)
        self.assertIsInstance(gp.children[0], Parent)

    def test_find_by_id(self) -> None:
        tree = FamilyTree.from_dict(SAMPLE_TREE)
        person = tree.find_by_id("c-2")
        self.assertIsInstance(person, Child)
        assert person is not None
        self.assertEqual(person.name, "Bao Nguyen")

    def test_json_round_trip(self) -> None:
        original = FamilyTree.from_dict(SAMPLE_TREE)
        with tempfile.TemporaryDirectory() as temp_dir:
            export_path = Path(temp_dir) / "tree.json"
            original.to_json(export_path)
            reloaded = FamilyTree.from_json(export_path)
        self.assertEqual(original, reloaded)

    def test_broken_spouse_link_raises(self) -> None:
        bad = dict(SAMPLE_TREE)
        bad["generations"] = dict(SAMPLE_TREE["generations"])
        parents = [dict(p) for p in SAMPLE_TREE["generations"]["parents"]]
        parents[0]["spouse_id"] = "p-99"
        bad["generations"]["parents"] = parents
        with self.assertRaises(FamilyTreeValidationError):
            FamilyTree.from_dict(bad)

    def test_empty_file_raises_parse_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            empty_path = Path(temp_dir) / "empty.json"
            empty_path.write_text("", encoding="utf-8")
            with self.assertRaises(FamilyTreeParseError):
                FamilyTree.from_json(empty_path)

    def test_to_dict_exports_ids_not_nested_objects(self) -> None:
        tree = FamilyTree.from_dict(SAMPLE_TREE)
        data = tree.to_dict()
        parent_data = data["generations"]["parents"][0]
        self.assertEqual(parent_data["children"], ["c-1", "c-2"])
        self.assertIsInstance(parent_data["children"][0], str)


if __name__ == "__main__":
    unittest.main()
