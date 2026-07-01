import json
import logging
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_ARRAY_PATH = BASE_DIR / "03_arrays" / "mixed_shape_array.json"

logger = logging.getLogger(__name__)


class MatrixShapeError(Exception):
    """Base exception for mixed array shape operations."""


def load_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError as exc:
        raise MatrixShapeError(f"File not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise MatrixShapeError(f"Invalid JSON in {path.name}: {exc.msg}") from exc


def describe_item(index: int, item: Any) -> None:
    kind = type(item).__name__

    if isinstance(item, list):
        print(f"  [{index}] list  -> length {len(item)}, values: {item}")
    elif isinstance(item, dict):
        keys = ", ".join(item.keys())
        print(f"  [{index}] dict  -> keys: {keys}")
    elif item is None:
        print(f"  [{index}] null")
    else:
        print(f"  [{index}] {kind}  -> {item!r}")


def describe_mixed_shape_array(data: list[Any]) -> None:
    print(f"Top-level array length: {len(data)}")
    print("Items by type and shape:")
    for index, item in enumerate(data):
        describe_item(index, item)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logger.info("Reading %s", DEFAULT_ARRAY_PATH)

    data = load_json(DEFAULT_ARRAY_PATH)
    if not isinstance(data, list):
        raise MatrixShapeError("Expected a JSON array")

    describe_mixed_shape_array(data)


if __name__ == "__main__":
    main()
