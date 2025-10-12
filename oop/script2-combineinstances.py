class Dog:

    def __init__(self, name, breed, owner):
        self.name = name
        self.breed = breed
        self.owner = owner

    def bark(self):
        print("woof woof")

class Owner:
    def __init__(self, name, address, number):
        self.name = name
        self.address = address
        self.number = number

owner = Owner("Ayush Agarwal", "Glasgow", "1234")
owner2 = Owner("Roshini Prasaad", "Glasgow", "1234")

dog = Dog("bruce", "scottish terrier", owner)
dog.bark()
print(dog.name)
print(dog.breed)

dog2 = Dog("freya","Hound", owner2)
dog2.bark()
print(dog2.owner.name)
print(dog2.owner.address)
