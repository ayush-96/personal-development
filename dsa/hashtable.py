class HashTable:
    def __init__(self, size=7):
        self.data_map = [None] * size  # address space - list with size, all items None

    def __hash(self, key):
        my_hash = 0
        for letter in key:
            my_hash = (my_hash + ord(letter) * 23) % len(self.data_map)
        return my_hash

    def print_table(self):
        for i, val in enumerate(self.data_map):
            print(f"{i}: {val}")

    def set_item(self, value, key):
        index = self.__hash(key)
        if self.data_map[index] is None:
            self.data_map[index] = []
        self.data_map[index].append([key, value])

    def get_item(self, key):
        index = self.__hash(key)
        if self.data_map[index] is not None:
            for i in range(len(self.data_map[index])):
                if self.data_map[index][i][0] == key:
                    return self.data_map[index][i][1]
        return None

    def keys(self):
        all_keys = []
        for i in range(len(self.data_map)):
            if self.data_map[i] is not None:
                for j in range(len(self.data_map[i])):
                    all_keys.append(self.data_map[i][j][0])
        return all_keys


my_hash_table = HashTable()

my_hash_table.set_item(1000, "nails")
my_hash_table.set_item(280, "screws")
my_hash_table.set_item(430, "bolts")
my_hash_table.set_item(433, "washers")
my_hash_table.print_table()
print("Item: {} ".format(my_hash_table.get_item("bolts")))

print("Keys: {} ".format(my_hash_table.keys()))
