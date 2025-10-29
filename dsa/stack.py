class Node:

    def __init__(self, value):
        self.value = value
        self.next = None

class Stack:

    def __init__(self, value):
        new_node = Node(value)
        self.top = new_node
        self.height = 1

    def print_stack(self):
        temp = self.top
        print("Current stack is:")
        while temp:
            print(temp.value)
            temp = temp.next

    def push(self, value):
        new_node = Node(value)
        if self.height == 0:
            self.top = new_node
        else:
            new_node.next = self.top
            self.top = new_node
        self.height += 1
        print("Pushing value to stack : {}".format(value))
        return new_node.value

    def pop(self):
        if self.height == 0:
            return None
        temp = self.top
        self.top = self.top.next
        self.height -= 1
        temp.next = None
        return temp.value

my_stack = Stack(5)
my_stack.push(6)
my_stack.push(8)
my_stack.push(9)
print("value popped: {}".format(my_stack.pop()))
my_stack.print_stack()
