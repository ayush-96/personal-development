import os
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


def build_schema_registry(schema_folder: Path) -> Registry:
    """Reads all json files in folder and bundles them into an immutable Registry."""
    registry = Registry()

    for file_path in schema_folder.glob("*.json"):
        with open(file_path, "r") as f:
            schema_content = json.load(f)

            # 1. Wrap the dictionary into a recognizable JSON Schema resource
            resource = Resource.from_contents(schema_content, default_specification=DRAFT202012)

            # 2. Extract the schema's internal '$id'
            schema_id = schema_content.get("$id")

            if schema_id:
                # 3. Add it to the registry. (Registry is immutable, so it returns a new copy)
                registry = registry.with_resource(uri=schema_id, resource=resource)
                print(f"Registered Schema: {schema_id} from {file_path.name}")

    return registry


def validate_folder(data_folder: Path, main_schema: dict, registry: Registry):
    """Compiles the validator using the registry and loops through data inputs."""
    # Build the validator with the loaded reference schema blueprint attached
    validator = Draft202012Validator(schema=main_schema, registry=registry)

    print("\n--- Starting Input File Validation ---")
    for file_path in data_folder.glob("*.json"):
        try:
            with open(file_path, "r") as f:
                data = json.load(f)

            # Perform validation pass
            validator.validate(instance=data)
            print(f"✓ {file_path.name}: Validated perfectly!")

        except json.JSONDecodeError:
            print(f"✗ {file_path.name}: Failed to parse (Invalid basic JSON syntax).")
        except Exception as e:
            # Captures validation constraints (missing keys, data type issues, etc.)
            print(f"✗ {file_path.name}: Validation Error -> {str(e).splitlines()[0]}")



if __name__ == "__main__":
    # Define absolute directory paths cleanly using pathlib
    BASE_DIR = Path(__file__).resolve().parent
    SCHEMA_DIR = BASE_DIR / "schemas"
    DATA_DIR = BASE_DIR / "input_data"

    # Compile schema components
    schema_lookup_registry = build_schema_registry(SCHEMA_DIR)

    # Open the root blueprint file directly to feed to the validator
    with open(SCHEMA_DIR / "main_schema.json", "r") as f:
        root_schema = json.load(f)

    # Execute folder batch validation processing
    validate_folder(DATA_DIR, root_schema, schema_lookup_registry)