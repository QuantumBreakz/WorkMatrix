import asyncio
import logging

from aiohttp import web

logger = logging.getLogger("workmatrix")

async def handle_health(request):
    return web.json_response({ "status": "ok" })

async def start_http_server():
    # build the aiohttp app
    app = web.Application()
    app.router.add_get("/health", handle_health)

    runner = web.AppRunner(app)
    await runner.setup()

    site = web.TCPSite(runner, "0.0.0.0", 8000)
    await site.start()

    logger.info("HTTP Server listening on http://0.0.0.0:8000/health")

    # keep the server alive forever
    # (this task will never complete on its own)
    while True:
        await asyncio.sleep(3600)
