from typing import List


class Solution:

    def longestCommonPrefix(self, strs: List[str]) -> str:
        if not strs:
            return ""

        shortest = min(strs, key=len)
        prefix = ""
        print(shortest)

        for i in range(len(shortest)):
            for word in strs:
                if word[i] != shortest[i]:
                    return prefix
            prefix += shortest[i]
        return prefix


input = ["flower", "flow", "flight"]
sol = Solution()
sol.longestCommonPrefix(input)
