import pandas as pd
from pathlib import Path


class Definition:
    def __init__(self, term: str):
        self.term = term.strip().lower()  # Good practice: normalize input

    def get(self):
        # Get the path to data.csv correctly
        current_file = Path(__file__)
        data_path = current_file.parent.parent / "data.csv"  # Go up two levels

        try:
            df = pd.read_csv(data_path)

            result = df[df['word'].str.lower() == self.term]

            if result.empty:
                return ("Sorry, the word is not in our dictionary.",)

            # Return all definitions as tuple (in case a word has multiple definitions)
            return tuple(result['definition'].tolist())

        except FileNotFoundError:
            return ("Error: data.csv file not found.",)
        except Exception as e:
            return (f"Error reading dictionary: {str(e)}",)