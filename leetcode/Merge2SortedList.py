from typing import Optional


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        # Dummy node to build the merged list
        dummy = ListNode()
        current = dummy

        # Traverse both lists and attach the smaller node to current
        while list1 and list2:
            if list1.val <= list2.val:
                current.next = list1
                list1 = list1.next
            else:
                current.next = list2
                list2 = list2.next
            current = current.next

        # If any list still has nodes, attach the rest
        if list1:
            current.next = list1
        if list2:
            current.next = list2

        return dummy.next


# Helper to convert a Python list to a linked list
def create_linked_list(arr):
    dummy = ListNode()
    current = dummy
    for val in arr:
        current.next = ListNode(val)
        current = current.next
    return dummy.next


# Helper to print the linked list
def print_linked_list(node):
    result = []
    while node:
        result.append(node.val)
        node = node.next
    print(result)


# Create proper linked lists
list1 = create_linked_list([1, 2, 4])
list2 = create_linked_list([1, 3, 4, 6])

# Merge and print
sol = Solution()
merged_head = sol.mergeTwoLists(list1, list2)
print_linked_list(merged_head)
