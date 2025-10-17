class Solution:
    def climbStairs(self, n: int) -> int:
        i = 1
        j = 2
        while i+j == n:
            tmp = i + j
            i = j
            j = tmp
        return 3


sol = Solution()
sol.climbStairs(n=3)
