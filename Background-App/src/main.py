import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

from .services.websocket_server import start_websocket_server
from .services.monitor_api         import APIMonitor
from .services.http_server         import start_http_server

# load env vars from .env
load_dotenv()

def setup_logging():
    logger = logging.getLogger("workmatrix")
    logger.setLevel(logging.INFO)
    os.makedirs("logs", exist_ok=True)

    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    fh = logging.FileHandler("logs/workmatrix.log")
    fh.setFormatter(fmt)

    logger.addHandler(ch)
    logger.addHandler(fh)
    return logger

logger = setup_logging()

async def main():
    logger.info("Booting WorkMatrix services…")

    # 1) WebSocket
    ws_task = asyncio.create_task(start_websocket_server())

    # 2) API monitor (might be sync or async)
    api_mon = APIMonitor()
    if asyncio.iscoroutinefunction(api_mon.run):
        api_task = asyncio.create_task(api_mon.run())
    else:
        # wrap the sync .run() in a thread so it won't block the loop
        api_task = asyncio.create_task(asyncio.to_thread(api_mon.run))

    # 3) HTTP server
    http_task = asyncio.create_task(start_http_server())

    # wait on all three
    await asyncio.gather(ws_task, api_task, http_task)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down on user interrupt")
        sys.exit(0)
    except Exception:
        logger.exception("Fatal error")
        sys.exit(1)
