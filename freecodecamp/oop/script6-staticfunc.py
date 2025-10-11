# Static methods

# A static method is a method that belongs to class itself rather than instance of the class
# '@staticmethod' decorator is used to define static method
# They don't user 'self' as parameters, so they can't modify instance related data
# They don't require instance attribute related data - They are helper/utility method


class BankAccount:
    MIN_BALANCE = 100

    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if self._is_valid_amount(amount) > 0:
            self.balance += amount
            self.__log_transaction("deposit", amount)
        else:
            print("Amount must be positive.")

    def _is_valid_amount(self, amount):   # protected method
        return amount > 0

    def __log_transaction(self, transaction_type, amount):
        print("Logging transaction type {} of amount {}... New balance is: {}"
                .format(transaction_type, amount, self.balance))


    @staticmethod
    def is_valid_interest_rate(interest_rate):
        return 0 <= interest_rate <= 5

account = BankAccount("Ayush Agarwal", 500)
account.deposit(200)

print(BankAccount.is_valid_interest_rate(3))
print(BankAccount.is_valid_interest_rate(10))

account._is_valid_amount(200)
# account.__log_transaction('withdraw', 300)