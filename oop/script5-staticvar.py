# Static attributes
# A static attribute or class attribute belongs to the class itself, not to any instance of the class.
# These are shared by all instances of the class, only one copy is available to everyone.
# Can be accessed by the class itself, not just instances. But are stored at class level.

# When?
# Static attributes are useful when a property is common to all instances = like counters, trackers (e.g., user counts)
# It could be default value or configuration. e.g., salary for a department.

# Instance variables are specific to an object of the class, accessed through the 'self' keyword

class User:

    user_count = 0

    def __init__(self, name, age):
        self.name = name
        self.age = age
        User.user_count += 1

    def display_user(self):
        print("Hello {}!".format(self.name))


user1 = User("Ayush Agarwal", 29)
user2 = User("Roshini Prasaad", 25)
print(user1.user_count) # count remains same - just accessed through instance instead of class
print(user2.user_count)  # count remains same - just accessed through instance instead of class
print(User.user_count)