# Abstraction
# e.g., pressing button on t.v. remote
# Reduce complexity by hiding unnecessary details
# Providing simple high level interface to the user by hiding complex intricacy of how it is working internally

class EmailService:

    def _connect(self):
        print("Connecting to email server!")

    def _authenticate(self):
        print("Authenticating...")

    def send_email(self):
        self._connect()
        self._authenticate()
        print("Sending email...")
        self._disconnect()

    def _disconnect(self):
        print("Disconnecting from email server!")

email = EmailService()
email.send_email()  # just this method is needed to send email without having to worry about connect, authenticate, etc.
