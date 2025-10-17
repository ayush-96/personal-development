class Solution:
    def addBinary(self, a: str, b: str) -> str:
        print(bin(int(a, 2) + int(b, 2)))
        return bin(int(a, 2) + int(b, 2))[2:]


sol = Solution()
sol.addBinary(a="1010", b="1011")
