class Solution:

    def isValid(self, s: str) -> bool:
        stack = []
        flag = 0
        try:
            for char in s:
                if char == '(' or char == '{' or char == '[':
                    stack.append(char)
                elif char == ']' and stack.pop() != '[':
                    return False
                elif char == ')' and stack.pop() != '(':
                    return False
                elif char == '}' and stack.pop() != '{':
                    return False
        except:
            flag = 1
        return (not flag) and (len(stack) == 0)


input = "()[]{}"
sol = Solution()
sol.isValid(input)
