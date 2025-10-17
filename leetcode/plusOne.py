from typing import List


class Solution:

    def plusOne(self, digits: List[int]) -> List[int]:
        temp = 0
        for i in range(len(digits)):
            temp = temp*10 + digits[i]
        return [int(i) for i in str(temp+1)]


sol = Solution()
sol.plusOne(digits=[4, 3, 2, 1])
