class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        print("Hello, my name is {}! I am {} years old.".format(self.name, self.age))

person1 = Person("Ayush Agarwal", 29)
person1.greet()

person2 = Person("Roshini Prasaad", 25)
person2.greet()
