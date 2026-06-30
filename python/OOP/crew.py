class Crew:
    species = "human"  # class attribute available to all instances

    # if an object updates class attributes, only that objects value is updated

    # special dunder method that runs on object instantiation
    # self takes on the value of newly created object
    def __init__(self, name, age):
        self.name = name
        self.age = age


class Starship:
    ship_type = "Exploration Vessel"

    def __init__(self, name, crew_size):
        self.name = name
        self.crew_size = crew_size

    def description(self):
        return f"{self.ship_type} is {self.name}"

    def set_destination(self, destination):
        return f"{self.ship_type} is {self.name}, from {destination}"

class ScienceVessel(Starship):
    ship_type = "Science Vessel"

    def __init__(self, name, crew_size, labs):
        super().__init__(name, crew_size)
        self.labs = labs

    def __str__(self):
        return f"{self.ship_type} is {self.name}, from {self.labs}"

enterprise = Starship("Enterprise", 4330)
serenity = Starship("Serenity", 593)
enterprise.set_destination("Earth")

discovery = ScienceVessel("Discovery", 235, 99)
print(discovery.set_destination("Earth"))
print(discovery)
print(isinstance(discovery, ScienceVessel))
print(isinstance(discovery, Starship))
