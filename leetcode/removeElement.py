from typing import List


class Solution:

    def removeElement(self, nums: List[int], val: int) -> int:
        i = 0
        for j in range(len(nums)-1):
            if nums[j] != val:
                nums[i] = nums[j]
                i += 1
        print(i)
        return i


sol = Solution()
sol.removeElement(nums=[3, 2, 2, 3], val=3)
