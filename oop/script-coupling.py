# Coupling
# Refers to the degree of dependency between classes or modules within a system
# Tightly coupledo or high coupling means difficult to modify as there is too much interdependency
# ABC = abstract based class

from abc import ABC, abstractmethod


class NotificationService(ABC):
    @abstractmethod
    def send_notification(self, message: str):
        pass


class Email(NotificationService):
    def send_notification(self, message: str):  # abstract method has to be implemented
        print("Sending email: {}".format(message))


class MobileService(NotificationService):
    def send_notification(self, message: str):
        print("Sending text messages: {}".format(message))


class Order:

    def __init__(self, notification_service: NotificationService):
        self.notification_service = notification_service

    def create(self):
        # perform order creation, validate, etc.
        # email = Email()
        # email.send_notification("Order is placed successfully")
        self.notification_service.send_notification("Hi Order is placed.")


# order = Order()
# order.create()  # tightly coupled with email class as instance is being created in order class

# Order class decoupled from the Email and Mobile class, without modifying any code in these classes
# Changes in email class will not break Order class
order = Order(MobileService())
order.create()

order = Order(Email())
order.create()
