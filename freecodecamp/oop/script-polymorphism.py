# Polymorphism

# The word means "many forms"
# More generic manner, easier extension of the code without having to modify existing logic

class Vehicle:
    def __init__(self, make, model, year):
        self.make = make
        self.model = model
        self.year = year

    def start(self):
        print("Vehicle is starting")

    def stop(self):
        print("Vehicle is stopping")

class Car(Vehicle):
    def __init__(self, make, model, year, number_of_doors):
        super().__init__(make, model, year)
        self.number_of_doors = number_of_doors

    # def start(self):
    #     print("This car will start")
    #
    # def stop(self):
    #     print("This car will stop")

class Bike(Vehicle):
    def __init__(self, make, model, year, number_of_wheels):
        super().__init__(make, model, year)
        self.number_of_wheels = number_of_wheels

    # def start_bike(self):
    #     print("This bike will start")
    #
    # def stop_bike(self):
    #     print("This bike will stop")


class Plane(Vehicle):
    def __init__(self, make, model, year, number_of_doors):
        super().__init__(make, model, year)
        self.number_of_doors = number_of_doors

    def start(self):
        print("Plan is starting")

    def stop(self):
        print("Plan is stopping")


vehicles:list[Vehicle] = [  # add type hinting
    Car("Honda", "Accord", 2012, 4),
    Bike("Yamaha", "FZ", 2019, 2),
    Plane("Boeing", "747", 2011, 8)
] 


# for vehicle in vehicles:  # if new vehicle type is added - more code change is required
#     if (isinstance(vehicle, Car)):
#         print("Inspecting {} - {} : Type {}".format(vehicle.make, vehicle.model, type(vehicle).__name__))
#         vehicle.start()
#         vehicle.stop()
#     elif (isinstance(vehicle, Bike)):
#         print(print("Inspecting {} - {} : Type {}".format(vehicle.make, vehicle.model, type(vehicle).__name__)))
#         vehicle.start_bike()
#         vehicle.stop_bike()
#     else:
#         raise TypeError("{} is not a car or bike".format(vehicle.make))

# for vehicle in vehicles:
#     if isinstance(vehicle, Vehicle):
#         print(print("Inspecting {} - {} : Type {}".format(vehicle.make, vehicle.model, type(vehicle).__name__)))
#         vehicle.start()
#         vehicle.stop()

for vehicle in vehicles: # Type hinting - python knows
    print(print("Inspecting {} - {} : Type {}".format(vehicle.make, vehicle.model, type(vehicle).__name__)))
    vehicle.start()
    vehicle.stop()