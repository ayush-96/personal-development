def print_n_number(n: int):
    for i in range(n):
        for j in range(n):
            print(i, ", ", j)

    for k in range(n):
        print(k)


def add_item(n):
    return n + n + n


dict1 = {'val': 11}
dict2 = dict1
print(id(dict1))
print(id(dict2))

dict2['val'] = 22
print(id(dict1))
print(id(dict2))

dict3 = {'val': 33}
dict2 = dict3
dict1 = dict2
print(id(dict1))
print(id(dict2))
print(id(dict3))

# original dict 1 has no one pointing to it -> garbage collection


print_n_number(n=10)
