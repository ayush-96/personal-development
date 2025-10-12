# public , protected , private variables and their updates
from datetime import datetime


class User:
    def __init__(self, username, email, password):
        self.username = username
        self._email = email
        self.password = password

    def say_hello(self, user):
        print("Sending message to {}: Hi {}, it's {}".format(user.username, user.username, self.username))

    def get_email(self):
        print("Accessed at {}".format(datetime.now()))
        return self._email

    def set_email(self, new_email):
        if "@" in new_email:
            self._email = new_email
        else:
            print("Invalid email")


user1 = User("Ayush", "agarwal3@gmail", "123")
user2 = User("Roshini", "roro@orkut", "ffdf")

user1.say_hello(user2)
# print(user1.__email) # accessing private member - developer are responsible and not strictly imposed
user1.set_email("loveroro@yahoo.in")
print(user1.get_email())


