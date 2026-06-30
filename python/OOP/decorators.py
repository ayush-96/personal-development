class Person:

    def __init__(self, first_name, last_name):
        self.first_name = first_name
        self.last_name = last_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


ayush = Person("Ayush", "Agarwal")
print(ayush.full_name)

class Temperature:

    # The setter stores the value in ._celsius (non-public), while the .celsius property exposes it as the public interface.
    # The leading underscore signals that ._celsius is an implementation detail.
    #
    # The key insight is in .__init__(): assigning to self.celsius (no underscore) goes through the setter,
    # so the validation runs even during construction.
    # A call like Temperature(-300) raises ValueError immediately rather than creating an invalid object.
    #
    # Assigning directly to self._celsius in .__init__() would bypass the setter and skip the validation entirely.

    def __init__(self, celsius):
        """Initialize the temperature."""
        self.celsius = celsius

    @property
    def celsius(self):
        """Return the temperature in Celsius."""
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        """Validate and set the temperature in Celsius."""
        if value < -273.15:
            raise ValueError(f"{value} is below absolute zero (-273.15)")
        self._celsius = value