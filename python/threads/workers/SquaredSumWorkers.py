import threading

class SquaredSumWorker(threading.Thread):

    def __init__(self, number, **kwargs):
        self._number = number
        super(SquaredSumWorker, self).__init__(**kwargs)
        self.start()
    
    def _calculate_sum_of_squares(self):
        sum_squares = 0
        for i in range(1, self._number + 1):
            sum_squares += i ** 2

        print(sum_squares)

    def run(self):
        self._calculate_sum_of_squares()
    
    