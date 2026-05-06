import time
from workers.SquaredSumWorkers import SquaredSumWorker
from workers.SleepyWorkers import SleepyWorker


def main():
    calc_start_time = time.time()

    current_workers = []
    for i in range(5):
        maximum_value = (i+1)*1000000
        squared_sum_worker = SquaredSumWorker(number=maximum_value, daemon=True)
        current_workers.append(squared_sum_worker)

    for i in range(len(current_workers)):
        current_workers[i].join()

    print(f"Calculation time: round({time.time() - calc_start_time}, 2) seconds")

    sleep_start_time = time.time()

    current_workers = [] 
    for i in range(1, 6):
        sleepy_worker = SleepyWorker(seconds=i, daemon=True)
        current_workers.append(sleepy_worker)

    
    # for i in range(len(current_workers)):
    #     current_workers[i].join()

    print(f"Sleep time: round({time.time() - sleep_start_time}, 2) seconds")

if __name__ == "__main__":
    main()