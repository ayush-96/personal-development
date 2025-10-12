# Python property: similar to using getter and setter but uses 'property' decorator for attribute.
#     less code change required as no need to update "function" or "protected variable name".
#     @attribute_name.setter for setter function
class User:
    def __init__(self, username, email, password):
        self.username = username
        self._email = email
        self.password = password

    @property
    def email(self):
        print("email accessed!")
        return self._email

    @email.setter
    def email(self, new_email):
        self._email = new_email

user1 = User("Ayush", "ayushloveroshini@gmail.com", "ppsmol")
user1.email = "this is not email"
print(user1.email)
