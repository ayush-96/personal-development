class Solution:

    def romanToInt(self, s: str) -> int:
        symbol_dict = {
            'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
        }
        sum = 0
        for symbol in range(len(list(s))-1):
            if symbol_dict[s[symbol]] < symbol_dict[s[symbol+1]]:
                sum -= symbol_dict[s[symbol]]
            else:
                sum += symbol_dict[s[symbol]]
        sum += symbol_dict[s[len(s) - 1]]
        print(abs(sum))
        return sum


input = "LVIII"
sol = Solution()
sol.romanToInt(s=input)
