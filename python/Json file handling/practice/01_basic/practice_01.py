import json
from pathlib import Path

PRACTICE_DIR = Path(__file__).resolve().parent

class JsonPractice:

    def __init__(self, base_dir: Path = PRACTICE_DIR):
        self.base_dir = base_dir
    
    @property
    def config_path():
        return PRACTICE_DIR / "01_basic" / "config_flags.json"

    @property
    def empty_arrays_path():
        return PRACTICE_DIR / "01_basic" / "empty_array.json"

    @property
    def empty_objects_path():
        return PRACTICE_DIR / "01_basic" / "empty_object.json"

    @property
    def simple_profile_path():
        return PRACTICE_DIR / "01_basic" / "simple_profile.json"

    def load_json(self, file_path: Path):
        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)
        
    def print_items(self, file_path: Path) -> None:
        data = self.load_json(file_path)
        if not data:
            print(f"{file_path.name} is empty.")
            return

        if isinstance(data, dict):
            for key, value in data.items():
                print(f"Key: {key}, Value: {value}")
        else:
            print(data)


if __name__ == "__main__":
    practice = JsonPractice()
    # Use properties like attributes — no ()
    practice.print_items(practice.simple_profile_path)
    practice.print_items(practice.empty_arrays_path)
    practice.print_items(practice.empty_objects_path)
    practice.print_items(practice.config_path)