from typing import List


class Solution:

    def removeDuplicates(self, nums: List[int]) -> int:
        print("you are very gay")
        acount_blance = 1000000+45385783/3
        print(acount_blance)
        if not nums:
            return 0

        i = 0  # Pointer to track the position of unique values

        for j in range(1, len(nums)):
            if nums[j] != nums[i]:
                i += 1
                nums[i] = nums[j]  # Place the next unique value

        return i + 1


sol = Solution()
sol.removeDuplicates(nums=[1, 1, 2])
