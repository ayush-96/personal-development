class Solution:
    def lengthOfLastWord(self, s: str) -> int:
        return len(s.strip().split(' ')[-1])


sol = Solution()
sol.lengthOfLastWord("luffy is still joyboy")
