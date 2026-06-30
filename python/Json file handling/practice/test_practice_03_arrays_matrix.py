"""Tests for practice_03_arrays_matrix.py (stdlib unittest — no extra deps)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

PRACTICE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PRACTICE_DIR))

from practice_03_arrays_matrix import (
    Matrix,
    MatrixParseError,
    MatrixValidationError,
)

SAMPLE_MATRIX = {
    "description": "Test grid",
    "rows": 2,
    "cols": 3,
    "grid": [
        [1, 2, 3],
        [4, 5, 6],
    ],
}


class MatrixValidationTests(unittest.TestCase):
    def test_rejects_wrong_row_count(self) -> None:
        bad = dict(SAMPLE_MATRIX)
        bad["rows"] = 3
        with self.assertRaises(MatrixValidationError):
            Matrix.from_dict(bad)

    def test_rejects_wrong_col_count(self) -> None:
        bad = dict(SAMPLE_MATRIX)
        bad["grid"] = [[1, 2], [3, 4]]
        with self.assertRaises(MatrixValidationError):
            Matrix.from_dict(bad)

    def test_rejects_non_integer_cell(self) -> None:
        bad = dict(SAMPLE_MATRIX)
        bad["grid"] = [[1, "x", 3], [4, 5, 6]]
        with self.assertRaises(MatrixValidationError):
            Matrix.from_dict(bad)

    def test_rejects_missing_field(self) -> None:
        bad = {"description": "x", "rows": 1, "cols": 1}
        with self.assertRaises(MatrixValidationError):
            Matrix.from_dict(bad)


class MatrixOperationsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.matrix = Matrix.from_dict(SAMPLE_MATRIX)

    def test_get_cell(self) -> None:
        self.assertEqual(self.matrix.get_cell(1, 2), 6)

    def test_get_cell_out_of_range(self) -> None:
        with self.assertRaises(IndexError):
            self.matrix.get_cell(2, 0)

    def test_row_sums(self) -> None:
        self.assertEqual(self.matrix.row_sums(), (6, 15))

    def test_col_sums(self) -> None:
        self.assertEqual(self.matrix.col_sums(), (5, 7, 9))

    def test_flatten(self) -> None:
        self.assertEqual(self.matrix.flatten(), (1, 2, 3, 4, 5, 6))

    def test_grid_is_immutable_tuple(self) -> None:
        grid = self.matrix.grid
        self.assertIsInstance(grid, tuple)
        self.assertIsInstance(grid[0], tuple)


class MatrixIOTests(unittest.TestCase):
    def test_load_real_file(self) -> None:
        path = PRACTICE_DIR / "03_arrays" / "matrix.json"
        matrix = Matrix.from_json(path)
        self.assertEqual(matrix.rows, 3)
        self.assertEqual(matrix.cols, 4)
        self.assertEqual(matrix.get_cell(0, 0), 1)
        self.assertEqual(matrix.get_cell(2, 3), 12)

    def test_json_round_trip(self) -> None:
        original = Matrix.from_dict(SAMPLE_MATRIX)
        with tempfile.TemporaryDirectory() as temp_dir:
            export_path = Path(temp_dir) / "matrix.json"
            original.to_json(export_path)
            reloaded = Matrix.from_json(export_path)
        self.assertEqual(original, reloaded)

    def test_empty_file_raises_parse_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            empty_path = Path(temp_dir) / "empty.json"
            empty_path.write_text("", encoding="utf-8")
            with self.assertRaises(MatrixParseError):
                Matrix.from_json(empty_path)


if __name__ == "__main__":
    unittest.main()
