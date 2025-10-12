# Inheritance

# It's a fundamental way in OOP that involves creating new classes (subclasses or derived classes)
# These derived classes are based on existing ones (super class or base class)
# A Car -> is a Vehicle
# A Bike -> is a  Vehicle
# Makes it easy to implement properties by using, less modification needed as code needs to be changed in one place

class Vehicle():
    def __init__(self, make, model, year):
        self.make = make
        self.model = model
        self.year = year

    def start(self):
        print("Vehicle is starting...")

    def stop(self):
        print("Vehicle is stopping...")


class Car(Vehicle):

    def __init__(self, brand, model, year, number_of_doors, number_of_wheels):
        super().__init__(brand, model, year)
        self.number_of_doors = number_of_doors
        self.number_of_wheels = number_of_wheels


class Bike(Vehicle):

    def __init__(self, brand, model, year, number_of_wheels):
        super().__init__(brand, model, year)
        self.number_of_wheels = number_of_wheels


car = Car("Ford", "Focus", 2008, 4, 4, )
bike = Bike("Yamaha", "FZ", 2019, 2)

print(car.__dict__)
