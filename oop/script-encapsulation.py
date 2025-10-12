# Encapsulation
# Bundling the data attributes, methods in a single unit called class
# hiding the details (abstraction) from outside world, focusing on high level to use effectively
# methods dictate the rules on how the instance attributes are modified
# mechanism is a way of enabling abstraction


class BadBankAccount:

    def __init__(self, balance):
        self.balance = balance


# account1 = BadBankAccount(0.0)
# account1.balance = -5.0
# print(account1.balance)

class BankAccount:
    def __init__(self):
        self._balance = 0.0

    @property
    def balance(self):  # getter property method
        return self._balance

    def deposit(self, value):
        if value <= 0:
            raise ValueError("Deposit must be greater than zero")
        else:
            self._balance += value

    def withdraw(self, value):
        if value <= 0:
            raise ValueError("Withdraw must be greater than zero")
        if value >= self.balance:
            raise ValueError("Withdraw must be less than balance")
        else:
            self._balance -= value

account = BankAccount()
print(account.balance)
# account.balance = -1  # raises the error since no setter is in place; forced to use withdraw function
account.deposit(100)
print(account.balance)
account.withdraw(1)
print(account.balance)
