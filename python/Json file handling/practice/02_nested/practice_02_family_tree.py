from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_FAMILY_TREE_PATH = BASE_DIR / "02_nested" / "family_tree.json"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class FamilyTreeError(Exception):
    """Base exception for family tree operations."""


class FamilyTreeValidationError(FamilyTreeError):
    """Raised when JSON structure, types, or cross-references are invalid."""


class FamilyTreeParseError(FamilyTreeError):
    """Raised when JSON syntax is invalid or the file is empty."""


class FamilyTreeIOError(FamilyTreeError):
    """Raised when file operations fail."""


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _require_dict(value: Any, field_name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise FamilyTreeValidationError(
            f"Expected object for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise FamilyTreeValidationError(
            f"Expected array for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_non_empty_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise FamilyTreeValidationError(
            f"Expected non-empty string for '{field_name}'"
        )
    return value.strip()


def _require_id_list(value: Any, field_name: str) -> tuple[str, ...]:
    items = _require_list(value, field_name)
    result: list[str] = []
    for index, item in enumerate(items):
        if not isinstance(item, str) or not item.strip():
            raise FamilyTreeValidationError(
                f"Expected non-empty string ID at {field_name}[{index}]"
            )
        result.append(item.strip())
    return tuple(result)


def _require_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise FamilyTreeValidationError(
            f"Expected integer for '{field_name}', got {type(value).__name__}"
        )
    return value


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class Child:

    __slots__ = ("_id", "_name", "_birth_year")

    def __init__(self, id: str, name: str, birth_year: int) -> None:
        self._id = _require_non_empty_string(id, "id")
        self._name = _require_non_empty_string(name, "name")
        self._birth_year = _require_int(birth_year, "birth_year")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Child:
        payload = _require_dict(data, "child")
        try:
            return cls(
                id=payload["id"],
                name=payload["name"],
                birth_year=payload["birth_year"],
            )
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Missing required child field: {exc.args[0]}"
            ) from exc

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self._id,
            "name": self._name,
            "birth_year": self._birth_year,
        }

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def birth_year(self) -> int:
        return self._birth_year

    def __repr__(self) -> str:
        return f"Child(id={self._id!r}, name={self._name!r}, birth_year={self._birth_year})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Child):
            return NotImplemented
        return self.to_dict() == other.to_dict()


class Parent:

    __slots__ = ("_id", "_name", "_spouse_id", "_child_ids", "_children")

    def __init__(
        self,
        id: str,
        name: str,
        spouse_id: str | None,
        child_ids: tuple[str, ...],
        children: tuple[Child, ...] = (),
    ) -> None:
        self._id = _require_non_empty_string(id, "id")
        self._name = _require_non_empty_string(name, "name")
        if spouse_id is not None:
            spouse_id = _require_non_empty_string(spouse_id, "spouse_id")
        self._spouse_id = spouse_id
        self._child_ids = child_ids
        self._children = children

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Parent:
        payload = _require_dict(data, "parent")
        try:
            return cls(
                id=payload["id"],
                name=payload["name"],
                spouse_id=payload.get("spouse_id"),
                child_ids=_require_id_list(payload["children"], "children"),
            )
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Missing required parent field: {exc.args[0]}"
            ) from exc

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "id": self._id,
            "name": self._name,
            "children": list(self._child_ids),
        }
        if self._spouse_id is not None:
            result["spouse_id"] = self._spouse_id
        return result

    def attach_children(self, children: tuple[Child, ...]) -> None:
        self._children = children

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def spouse_id(self) -> str | None:
        return self._spouse_id

    @property
    def child_ids(self) -> tuple[str, ...]:
        return self._child_ids

    @property
    def children(self) -> tuple[Child, ...]:
        """Resolved Child objects (populated after link resolution)."""
        return self._children

    def __repr__(self) -> str:
        return f"Parent(id={self._id!r}, name={self._name!r}, children={len(self._children)})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Parent):
            return NotImplemented
        return self.to_dict() == other.to_dict()


class Grandparent:
    """A grandparent; JSON stores parent IDs, domain model holds resolved Parent objects."""

    __slots__ = ("_id", "_name", "_child_ids", "_children")

    def __init__(
        self,
        id: str,
        name: str,
        child_ids: tuple[str, ...],
        children: tuple[Parent, ...] = (),
    ) -> None:
        self._id = _require_non_empty_string(id, "id")
        self._name = _require_non_empty_string(name, "name")
        self._child_ids = child_ids
        self._children = children

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Grandparent:
        payload = _require_dict(data, "grandparent")
        try:
            return cls(
                id=payload["id"],
                name=payload["name"],
                child_ids=_require_id_list(payload["children"], "children"),
            )
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Missing required grandparent field: {exc.args[0]}"
            ) from exc

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self._id,
            "name": self._name,
            "children": list(self._child_ids),
        }

    def attach_children(self, children: tuple[Parent, ...]) -> None:
        self._children = children

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def child_ids(self) -> tuple[str, ...]:
        return self._child_ids

    @property
    def children(self) -> tuple[Parent, ...]:
        """Resolved Parent objects (populated after link resolution)."""
        return self._children

    def __repr__(self) -> str:
        return f"Grandparent(id={self._id!r}, name={self._name!r}, children={len(self._children)})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Grandparent):
            return NotImplemented
        return self.to_dict() == other.to_dict()


# ---------------------------------------------------------------------------
# Registry + link resolution
# ---------------------------------------------------------------------------


class PersonRegistry:
    """Lookup table for resolving ID references to domain objects."""

    def __init__(
        self,
        grandparents: list[Grandparent],
        parents: list[Parent],
        children: list[Child],
    ) -> None:
        self._grandparents = {gp.id: gp for gp in grandparents}
        self._parents = {p.id: p for p in parents}
        self._children = {c.id: c for c in children}
        self._validate_unique_ids(grandparents, parents, children)

    @staticmethod
    def _validate_unique_ids(
        grandparents: list[Grandparent],
        parents: list[Parent],
        children: list[Child],
    ) -> None:
        seen: set[str] = set()
        for person in (*grandparents, *parents, *children):
            if person.id in seen:
                raise FamilyTreeValidationError(f"Duplicate person id: {person.id}")
            seen.add(person.id)

    def get_child(self, person_id: str) -> Child:
        try:
            return self._children[person_id]
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Unknown child id: {person_id}"
            ) from exc

    def get_parent(self, person_id: str) -> Parent:
        try:
            return self._parents[person_id]
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Unknown parent id: {person_id}"
            ) from exc

    def resolve_child_ids(self, child_ids: tuple[str, ...]) -> tuple[Child, ...]:
        return tuple(self.get_child(cid) for cid in child_ids)

    def resolve_parent_ids(self, parent_ids: tuple[str, ...]) -> tuple[Parent, ...]:
        return tuple(self.get_parent(pid) for pid in parent_ids)

    def find_by_id(self, person_id: str) -> Grandparent | Parent | Child | None:
        if person_id in self._grandparents:
            return self._grandparents[person_id]
        if person_id in self._parents:
            return self._parents[person_id]
        if person_id in self._children:
            return self._children[person_id]
        return None


def _validate_spouse_links(parents: list[Parent]) -> None:
    parent_ids = {p.id for p in parents}
    for parent in parents:
        if parent.spouse_id is None:
            continue
        if parent.spouse_id not in parent_ids:
            raise FamilyTreeValidationError(
                f"Parent {parent.id!r} references unknown spouse {parent.spouse_id!r}"
            )
        spouse = next(p for p in parents if p.id == parent.spouse_id)
        if spouse.spouse_id != parent.id:
            raise FamilyTreeValidationError(
                f"Spouse link mismatch: {parent.id!r} -> {parent.spouse_id!r}, "
                f"but {spouse.id!r} -> {spouse.spouse_id!r}"
            )


def _wire_relationships(
    grandparents: list[Grandparent],
    parents: list[Parent],
    registry: PersonRegistry,
) -> None:
    for parent in parents:
        resolved = registry.resolve_child_ids(parent.child_ids)
        parent.attach_children(resolved)

    for grandparent in grandparents:
        resolved = registry.resolve_parent_ids(grandparent.child_ids)
        grandparent.attach_children(resolved)


# ---------------------------------------------------------------------------
# Family tree aggregate
# ---------------------------------------------------------------------------


class FamilyTree:
    """Root aggregate for the Nguyen-style flat + linked JSON structure."""

    __slots__ = ("_family_name", "_grandparents", "_parents", "_children", "_registry")

    def __init__(
        self,
        family_name: str,
        grandparents: list[Grandparent],
        parents: list[Parent],
        children: list[Child],
        registry: PersonRegistry,
    ) -> None:
        self._family_name = _require_non_empty_string(family_name, "family_name")
        self._grandparents = list(grandparents)
        self._parents = list(parents)
        self._children = list(children)
        self._registry = registry

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FamilyTree:
        payload = _require_dict(data, "family_tree")
        try:
            family_name = payload["family_name"]
            generations = _require_dict(payload["generations"], "generations")
        except KeyError as exc:
            raise FamilyTreeValidationError(
                f"Missing required field: {exc.args[0]}"
            ) from exc

        grandparents = [
            Grandparent.from_dict(item)
            for item in _require_list(generations.get("grandparents", []), "grandparents")
        ]
        parents = [
            Parent.from_dict(item)
            for item in _require_list(generations.get("parents", []), "parents")
        ]
        children = [
            Child.from_dict(item)
            for item in _require_list(generations.get("children", []), "children")
        ]

        registry = PersonRegistry(grandparents, parents, children)
        _validate_spouse_links(parents)
        _wire_relationships(grandparents, parents, registry)

        return cls(
            family_name=family_name,
            grandparents=grandparents,
            parents=parents,
            children=children,
            registry=registry,
        )

    @classmethod
    def from_json(cls, path: Path | str) -> FamilyTree:
        file_path = Path(path)
        logger.info("Loading family tree from %s", file_path)

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise FamilyTreeIOError(f"File not found: {file_path}") from exc
        except OSError as exc:
            raise FamilyTreeIOError(f"Unable to read file: {file_path}") from exc

        if not raw_text.strip():
            raise FamilyTreeParseError(f"{file_path.name} is empty")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise FamilyTreeParseError(
                f"Invalid JSON in {file_path.name}: {exc.msg}"
            ) from exc

        return cls.from_dict(data)

    def to_dict(self) -> dict[str, Any]:
        return {
            "family_name": self._family_name,
            "generations": {
                "grandparents": [gp.to_dict() for gp in self._grandparents],
                "parents": [p.to_dict() for p in self._parents],
                "children": [c.to_dict() for c in self._children],
            },
        }

    def to_json(self, path: Path | str, *, indent: int = 2) -> None:
        file_path = Path(path)
        logger.info("Writing family tree to %s", file_path)
        try:
            file_path.write_text(
                json.dumps(self.to_dict(), indent=indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise FamilyTreeIOError(f"Unable to write file: {file_path}") from exc

    @property
    def family_name(self) -> str:
        return self._family_name

    @property
    def grandparents(self) -> tuple[Grandparent, ...]:
        return tuple(self._grandparents)

    @property
    def parents(self) -> tuple[Parent, ...]:
        return tuple(self._parents)

    @property
    def children(self) -> tuple[Child, ...]:
        return tuple(self._children)

    def find_by_id(self, person_id: str) -> Grandparent | Parent | Child | None:
        return self._registry.find_by_id(person_id)

    def iter_parents(self) -> Iterator[Parent]:
        yield from self._parents

    def print_summary(self) -> None:
        print(f"Family: {self._family_name}")
        for gp in self._grandparents:
            print(f"\nGrandparent: {gp.name} ({gp.id})")
            for parent in gp.children:
                print(f"  Parent: {parent.name} ({parent.id})")
                if parent.spouse_id:
                    spouse = self.find_by_id(parent.spouse_id)
                    if isinstance(spouse, Parent):
                        print(f"    Spouse: {spouse.name}")
                for child in parent.children:
                    print(f"    Child: {child.name} (born {child.birth_year})")

    def __repr__(self) -> str:
        return (
            f"FamilyTree(family_name={self._family_name!r}, "
            f"grandparents={len(self._grandparents)}, "
            f"parents={len(self._parents)}, "
            f"children={len(self._children)})"
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, FamilyTree):
            return NotImplemented
        return self.to_dict() == other.to_dict()


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
    )


def main() -> None:
    configure_logging()
    tree = FamilyTree.from_json(DEFAULT_FAMILY_TREE_PATH)
    tree.print_summary()

    export_path = BASE_DIR / "02_nested" / "family_tree_export.json"
    tree.to_json(export_path)
    logger.info("Exported copy to %s", export_path)


if __name__ == "__main__":
    main()