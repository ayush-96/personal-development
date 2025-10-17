class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        i = 0
        for i in range(len(haystack)):
            tmp = haystack[i:i+len(needle)]
            if len(tmp) < len(needle):
                break
            if tmp == needle:
                return i
        return -1


sol = Solution()
sol.strStr(haystack = "leetcode", needle = "leeto")



