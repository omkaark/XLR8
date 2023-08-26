import aiohttp
import asyncio

async def fetch(session, url):
    async with session.get(url, ssl=False) as response:
        return await response.text()

async def fetch_endpoint_multiple_times(url, times):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for _ in range(times)]
        return await asyncio.gather(*tasks)

async def main():
    endpoint_url = "http://0ijq1i6sp1.execute-api.us-east-1.amazonaws.com/dev/stream"
    num_requests = 500
    responses = await fetch_endpoint_multiple_times(endpoint_url, num_requests)
    return responses

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    response_list = loop.run_until_complete(main())
    print(response_list)
