import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import aiohttp
from .sqlite_manager import SQLiteManager
import backoff
import json

logger = logging.getLogger(__name__)

class SyncManager:
    def __init__(self, 
                 supabase_url: str, 
                 supabase_key: str, 
                 sqlite: SQLiteManager,
                 max_batch_size: int = 100,
                 sync_interval: int = 300):  # 5 minutes default
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.sqlite = sqlite
        self.max_batch_size = max_batch_size
        self.sync_interval = sync_interval
        self._running = False
        self._last_sync = datetime.min
        self._sync_lock = asyncio.Lock()
        self._headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }

    async def start(self):
        """Start the sync loop."""
        self._running = True
        while self._running:
            try:
                await self.sync_data()
            except Exception as e:
                logger.error(f"Error in sync loop: {e}")
            finally:
                await asyncio.sleep(self.sync_interval)

    def stop(self):
        """Stop the sync loop."""
        self._running = False

    @backoff.on_exception(backoff.expo,
                         (aiohttp.ClientError, asyncio.TimeoutError),
                         max_tries=5)
    async def sync_data(self):
        """Sync data with Supabase with retries and batching."""
        async with self._sync_lock:  # Prevent concurrent syncs
            try:
                current_time = datetime.now()
                
                # Get unsynced data from SQLite
                unsynced_data = await self._get_unsynced_data()
                if not unsynced_data:
                    logger.debug("No data to sync")
                    return

                # Process data in batches
                for batch in self._create_batches(unsynced_data):
                    try:
                        await self._sync_batch(batch)
                    except Exception as e:
                        logger.error(f"Error syncing batch: {e}")
                        continue

                self._last_sync = current_time
                logger.info(f"Sync completed successfully at {current_time}")

            except Exception as e:
                logger.error(f"Error in sync_data: {e}")
                raise

    async def _get_unsynced_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all unsynced data from SQLite."""
        try:
            return {
                'activities': self.sqlite.get_unsynced_activities(),
                'screenshots': self.sqlite.get_unsynced_screenshots(),
                'time_entries': self.sqlite.get_unsynced_time_entries()
            }
        except Exception as e:
            logger.error(f"Error getting unsynced data: {e}")
            return {}

    def _create_batches(self, data: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Split data into manageable batches."""
        batches = []
        for table, records in data.items():
            for i in range(0, len(records), self.max_batch_size):
                batch = records[i:i + self.max_batch_size]
                batches.append({
                    'table': table,
                    'records': batch
                })
        return batches

    async def _sync_batch(self, batch: Dict[str, Any]):
        """Sync a single batch of data to Supabase."""
        table = batch['table']
        records = batch['records']
        
        if not records:
            return

        try:
            async with aiohttp.ClientSession() as session:
                endpoint = f"{self.supabase_url}/rest/v1/{table}"
                async with session.post(endpoint,
                                     headers=self._headers,
                                     json=records,
                                     timeout=30) as response:
                    if response.status == 201:
                        # Update sync status in SQLite
                        record_ids = [r['id'] for r in records]
                        self.sqlite.mark_as_synced(table, record_ids)
                        logger.info(f"Successfully synced {len(records)} records to {table}")
                    else:
                        error_text = await response.text()
                        logger.error(f"Error syncing to {table}: {response.status} - {error_text}")
                        raise Exception(f"Sync failed: {error_text}")

        except asyncio.TimeoutError:
            logger.error(f"Timeout while syncing to {table}")
            raise
        except Exception as e:
            logger.error(f"Error in _sync_batch for {table}: {e}")
            raise

    async def force_sync(self):
        """Force an immediate sync."""
        try:
            await self.sync_data()
        except Exception as e:
            logger.error(f"Error in force sync: {e}")
            raise

    def get_sync_status(self) -> dict:
        """Get current sync status."""
        return {
            'last_sync': self._last_sync.isoformat() if self._last_sync else None,
            'is_running': self._running,
            'unsynced_count': self.sqlite.get_unsynced_counts()
        } 