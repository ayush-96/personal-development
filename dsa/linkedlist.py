# Python list is stored in consecutive places in memory
# Linked List is spread out in different places in the memory, each node pointing to the next node.
# Node is a value & pointer, basically a dictionary: { 'value': val, 'next': next_node }
# Linked List can be viewed as a set of dictionaries or a nested dictionary
# linked_list = {
#     "value": 1, --------------------------------> Head
#     "next": {
#         "value": 2,
#         "next": {
#             "value": 3,
#             "next": {
#                 "value": 4,
#                 "next": {
#                     "value": 5, -----------------> Tail
#                     "next": None
#                 }
#             }
#         }
#     }
# }
#
# Big(O):
#   Append at the end: O(1)
#   Remove at the end: O(N), need traversal till the end
#   Append at the start: O(1), head = new_node
#   Remove at the start: O(1), head = head.next
#   Insert in between: O(N)
#   Remove in between: O(N)
#   Lookup (value or index): O(n)

head = {
    "value": 1,
    "next": {
        "value": 2,
        "next": {
            "value": 3,
            "next": {
                "value": 4,
                "next": {
                    "value": 5,
                    "next": None
                }
            }
        }
    }
}
# print(head['next']['next']['value'])


class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self, value):  # Create a new node
        new_node = Node(value)
        self.head = new_node
        self.tail = new_node
        self.length = 1

    def print_list(self):
        temp = self.head
        while temp:
            print(temp.value)
            temp = temp.next

    def append(self, value) -> bool:    # Create a node and add it to the end
        new_node = Node(value)
        if self.tail is not None:
            self.tail.next = new_node
            self.tail = new_node
        else:
            self.head, self.tail = new_node, new_node
        self.length += 1
        return True

    def pop(self) -> bool:
        if self.head is None or self.length == 0:
            return None
        pre = temp = self.head
        while temp.next:
            pre = temp
            temp = temp.next
        self.tail = pre
        self.tail.next = None
        self.length -= 1
        if self.length == 0:
            self.head = None
            self.tail = None
        return temp.value

    def prepend(self, value):   # Create a node and add it to the front
        new_node = Node(value)
        if self.head is None or self.length == 0:
            self.head = new_node
            self.tail = new_node
        else:
            new_node.next = self.head
            self.head = new_node
        self.length += 1
        return True

    def pop_first(self):
        if self.head is None or self.length == 0:
            return None
        temp = self.head
        self.head = self.head.next
        temp.next = None
        self.length -= 1
        if self.length == 0:
            self.tail = None
        return temp.value

    def get(self, index):
        if index < 0 or index >= self.length:
            return None
        else:
            temp = self.head
            for _ in range(index):
                temp = temp.next
        return temp

    def set_value(self, index, value):
        temp = self.get(index)
        if temp:
            temp.value = value
            return True
        return False

    def insert(self, value, index): # Create a node and add it to the index position
        if index < 0 or index > self.length:
            return False
        if index == 0:
            return self.prepend(value)
        if index == self.length:
            return self.append(value)
        new_node = Node(value)
        temp = self.head
        temp = self.get(index-1)
        new_node.next = temp.next
        temp.next = new_node
        self.length += 1
        return True

    def remove(self, index):
        if index < 0 or index >= self.length:
            return False
        if index == self.length-1:
            return self.pop()
        if index == 0:
            return self.pop_first()
        prev = self.get(index-1)
        temp = prev.next
        prev.next = temp.next
        temp.next = None
        self.length -= 1
        return temp

    def reverse(self):
        temp = self.head
        self.head = self.tail
        self.tail = temp
        
        after = temp.next
        before = None
        for _ in range(self.length):
            after = temp.next
            temp.next = before
            before = temp
            tmep = after
        return True


my_linked_list = LinkedList(11)
my_linked_list.append(3)
my_linked_list.append(23)
my_linked_list.append(7)
# print(my_linked_list.pop())
# print(my_linked_list.pop())
# print(my_linked_list.pop())
# my_linked_list.prepend(1)
# my_linked_list.print_list()
# print(my_linked_list.get(2).value)

print("removed {}".format(my_linked_list.remove(2)))
my_linked_list.print_list()
