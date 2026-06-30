"""
Matrix domain model for nested JSON array practice.

Demonstrates:
- 2D grid validation (rows/cols vs grid shape)
- Immutable grid access via properties
- Array traversal helpers (get_cell, row_sums, flatten)
- Round-trip JSON serialization
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MATRIX_PATH = BASE_DIR / "03_arrays" / "matrix.json"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class MatrixError(Exception):
    """Base exception for matrix operations."""


class MatrixValidationError(MatrixError):
    """Raised when JSON structure, types, or grid dimensions are invalid."""


class MatrixParseError(MatrixError):
    """Raised when JSON syntax is invalid or the file is empty."""


class MatrixIOError(MatrixError):
    """Raised when file operations fail."""


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _require_dict(value: Any, field_name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise MatrixValidationError(
            f"Expected object for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise MatrixValidationError(
            f"Expected array for '{field_name}', got {type(value).__name__}"
        )
    return value


def _require_non_empty_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise MatrixValidationError(
            f"Expected non-empty string for '{field_name}'"
        )
    return value.strip()


def _require_positive_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise MatrixValidationError(
            f"Expected integer for '{field_name}', got {type(value).__name__}"
        )
    if value <= 0:
        raise MatrixValidationError(
            f"Expected positive integer for '{field_name}', got {value}"
        )
    return value


def _require_grid(value: Any, rows: int, cols: int) -> tuple[tuple[int, ...], ...]:
    raw_grid = _require_list(value, "grid")

    if len(raw_grid) != rows:
        raise MatrixValidationError(
            f"Grid has {len(raw_grid)} rows but 'rows' is {rows}"
        )

    grid: list[tuple[int, ...]] = []
    for row_index, row in enumerate(raw_grid):
        row_list = _require_list(row, f"grid[{row_index}]")
        if len(row_list) != cols:
            raise MatrixValidationError(
                f"Row {row_index} has {len(row_list)} columns but 'cols' is {cols}"
            )

        parsed_row: list[int] = []
        for col_index, cell in enumerate(row_list):
            if isinstance(cell, bool) or not isinstance(cell, int):
                raise MatrixValidationError(
                    f"Expected integer at grid[{row_index}][{col_index}], "
                    f"got {type(cell).__name__}"
                )
            parsed_row.append(cell)

        grid.append(tuple(parsed_row))

    return tuple(grid)


# ---------------------------------------------------------------------------
# Domain model
# ---------------------------------------------------------------------------


class Matrix:
    """2D numeric grid loaded from JSON."""

    __slots__ = ("_description", "_rows", "_cols", "_grid")

    def __init__(
        self,
        description: str,
        rows: int,
        cols: int,
        grid: tuple[tuple[int, ...], ...],
    ) -> None:
        self._description = _require_non_empty_string(description, "description")
        self._rows = _require_positive_int(rows, "rows")
        self._cols = _require_positive_int(cols, "cols")
        self._grid = grid

        if len(grid) != self._rows:
            raise MatrixValidationError(
                f"Grid row count {len(grid)} does not match rows={self._rows}"
            )
        for row_index, row in enumerate(grid):
            if len(row) != self._cols:
                raise MatrixValidationError(
                    f"Row {row_index} length {len(row)} does not match cols={self._cols}"
                )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Matrix:
        payload = _require_dict(data, "matrix")
        try:
            rows = _require_positive_int(payload["rows"], "rows")
            cols = _require_positive_int(payload["cols"], "cols")
            grid = _require_grid(payload["grid"], rows, cols)
            return cls(
                description=payload["description"],
                rows=rows,
                cols=cols,
                grid=grid,
            )
        except KeyError as exc:
            raise MatrixValidationError(
                f"Missing required matrix field: {exc.args[0]}"
            ) from exc

    @classmethod
    def from_json(cls, path: Path | str) -> Matrix:
        file_path = Path(path)
        logger.info("Loading matrix from %s", file_path)

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise MatrixIOError(f"File not found: {file_path}") from exc
        except OSError as exc:
            raise MatrixIOError(f"Unable to read file: {file_path}") from exc

        if not raw_text.strip():
            raise MatrixParseError(f"{file_path.name} is empty")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise MatrixParseError(
                f"Invalid JSON in {file_path.name}: {exc.msg}"
            ) from exc

        return cls.from_dict(data)

    def to_dict(self) -> dict[str, Any]:
        return {
            "description": self._description,
            "rows": self._rows,
            "cols": self._cols,
            "grid": [list(row) for row in self._grid],
        }

    def to_json(self, path: Path | str, *, indent: int = 2) -> None:
        file_path = Path(path)
        logger.info("Writing matrix to %s", file_path)
        try:
            file_path.write_text(
                json.dumps(self.to_dict(), indent=indent, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise MatrixIOError(f"Unable to write file: {file_path}") from exc

    @property
    def description(self) -> str:
        return self._description

    @property
    def rows(self) -> int:
        return self._rows

    @property
    def cols(self) -> int:
        return self._cols

    @property
    def grid(self) -> tuple[tuple[int, ...], ...]:
        """Immutable view of the 2D grid."""
        return self._grid

    def get_cell(self, row: int, col: int) -> int:
        if not (0 <= row < self._rows):
            raise IndexError(f"Row index out of range: {row}")
        if not (0 <= col < self._cols):
            raise IndexError(f"Column index out of range: {col}")
        return self._grid[row][col]

    def row_sums(self) -> tuple[int, ...]:
        return tuple(sum(row) for row in self._grid)

    def col_sums(self) -> tuple[int, ...]:
        return tuple(
            sum(self._grid[row][col] for row in range(self._rows))
            for col in range(self._cols)
        )

    def flatten(self) -> tuple[int, ...]:
        return tuple(cell for row in self._grid for cell in row)

    def iter_rows(self) -> Iterator[tuple[int, ...]]:
        yield from self._grid

    def print_grid(self) -> None:
        print(self._description)
        print(f"Dimensions: {self._rows} x {self._cols}")
        for row in self._grid:
            print("  " + " ".join(f"{cell:4d}" for cell in row))
        print(f"Row sums: {list(self.row_sums())}")

    def __repr__(self) -> str:
        return (
            f"Matrix(description={self._description!r}, "
            f"rows={self._rows}, cols={self._cols})"
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Matrix):
            return NotImplemented
        return self.to_dict() == other.to_dict()


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
    )


def main() -> None:
    configure_logging()
    matrix = Matrix.from_json(DEFAULT_MATRIX_PATH)
    matrix.print_grid()

    export_path = BASE_DIR / "03_arrays" / "matrix_export.json"
    matrix.to_json(export_path)
    logger.info("Exported copy to %s", export_path)


if __name__ == "__main__":
    main()
