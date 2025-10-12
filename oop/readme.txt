OOP is language agnostic.

Everything we create in python is object.
Objects are made from classes. Classes are the blueprint for objects meaning they describe what object can contain.
Different objects have different behaviours (duh!)
Functions/Methods, attributes, data of the class control how the object can be manipulated and behave.
Methods are just functions that are specific to a data type (which can be a class as well)
To access the method of a class, you use the object/instance of that class.

__init__ : special method in python to setup the data fields of the class
'self' keyword refers to current or specific objects. Giving access to current object's data.

getting and setting the data of an object:
    # traditional way (script3): make data attribute protected and use getter and setter function
    underscore(_) before variable name makes it protected. internal use in class only but still can be accessed outside
    of class but should not be (developer's responsibility). double underscore (__) will make it private & inaccessible.
    Python does it by 'name mangling' internally.
    Why to do it this way when variable can be directly accessed?
    It gives controlled way to access and in case any modification is required (e.g., email code accessed at)

    # Python property (script4): similar to using getter and setter but uses 'property' decorator for attribute.
    less code change required as no need to update "function" or "protected variable name".
    @attribute_name.setter for setter function
