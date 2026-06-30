class Vehicle:

    @classmethod
    def water_vehicle(cls, name, dimension):
        vehicle = Vehicle()
        vehicle.name = name
        vehicle.dimension = dimension
        vehicle.floats =True
        vehicle.num_wheels = 0
        return vehicle

    @classmethod
    def road_vechicle(cls, name, dimension, num_wheels):
        vehicle = Vehicle()
        vehicle.name = name
        vehicle.dimension = dimension
        vehicle.num_wheels = num_wheels
        vehicle.floats = False
        return vehicle

    def volume(self):
        return self.dimensions[0] * self.dimensions[1] * self.dimensions[2]

    @staticmethod
    def all_float(*vehicles):
        for vehicle in vehicles:
            if not vehicle.floats:
                return False
        return True

class Pizza:

    def __init__(self, ingredients):
        self.ingredients = ingredients

    def __repr__(self):
        return f"Pizza({self.ingredients})"

    @classmethod
    def margherita(cls):
        return cls(['cheese', 'tomatoes'])

    @classmethod
    def prosciuta(cls):
        return cls(['cheese', 'tomatoes', 'ham'])

    # Why cls Instead of Burger
    # Each factory builds the new instance with cls(...). That’s what makes class methods special.
    # cls is bound to the class the method is called on, so a subclass of Burger automatically gets factories that produce instances of the subclass:
    #
    # class TurkeyBurger(Burger):
    #     pass
    #
    # TurkeyBurger.cheeseburger()  # Returns a TurkeyBurger, not a Burger
    # If you hardcoded Burger(...) inside the factories, the subclass would silently get back a Burger instance instead, breaking polymorphism.