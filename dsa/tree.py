# It is like a node in a linked list, but with multiple pointers.
# For a binary tree, it has 2 pointers (left and right). But in general, they can have any number of nodes.
# Full tree: Every node points to 0 or 2 nodes.
# Perfect tree: Every level of tree is having full nodes.
# Complete tree: Adding the nodes from left to right without any gaps.
# Parent and Child nodes, same parent nodes are siblings. Nodes with no children are Leaf nodes.
# {
#     value: 4,
#     left: {
#         value: 3,
#         left: None,
#         right: None
#     },
#     right: {
#         value: 23,
#         left: None,
#         right: None
#     }
# }

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None


my_tree = BinarySearchTree()
print(my_tree.root)
