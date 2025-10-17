from typing import List


class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        i = 0
        for i in range(len(nums)):
            if nums[i] >= target:
                return i
        return i+1


sol = Solution()
sol.searchInsert(nums = [1,3,5,6], target = 7)
