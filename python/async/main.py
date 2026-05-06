import asyncio
import time

async def async_sleep(n):
    print(f"Sleeping for {n} seconds")
    await asyncio.sleep(n)
    print("Woke up")

async def print_hello():
    print("Hello")

async def main():
    start = time.time()
    task = asyncio.create_task(async_sleep(1))
    await task
    await async_sleep(2)
    
    await print_hello()
    end = time.time()
    print(f"Time taken: {end - start} seconds")

if __name__ == "__main__":
    asyncio.run(main())