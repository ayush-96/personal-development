# Composition

# Creating complex objects by combining simpler objects/components.

class Engine:
    def start(self):
        print("Engine starting")


class Wheels:
    def rotata(self):
        print("Rotating wheels")


class Chassis:
    def support(self):
        print("Chassis is supporting car")


class Seats:
    def sit(self):
        print("Sitting on seats")


class Car:
    def __init__(self):
        self._engine = Engine()
        self._wheels = Wheels()
        self._chassis = Chassis()
        self._seats = Seats()

    def start(self):
        self._engine.start()
        self._wheels.rotata()
        self._chassis.support()
        self._seats.sit()
        print("car started")


car = Car()
car.start()
