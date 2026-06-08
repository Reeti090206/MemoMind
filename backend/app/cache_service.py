import time
from typing import Any, Optional
from app.diagnostics_tracker import diagnostics_tracker

class SimpleCache:
    def __init__(self, default_ttl: float = 30):
        self.store = {}
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self.store:
            val, expiry = self.store[key]
            if time.time() < expiry:
                diagnostics_tracker.track_cache_hit()
                return val
            else:
                del self.store[key]
        diagnostics_tracker.track_cache_miss()
        return None

    def set(self, key: str, val: Any, ttl: Optional[float] = None):
        ttl_val = ttl if ttl is not None else self.default_ttl
        self.store[key] = (val, time.time() + ttl_val)

    def delete(self, key: str):
        if key in self.store:
            del self.store[key]

    def clear(self):
        self.store.clear()

# Global cache instance
backend_cache = SimpleCache(default_ttl=15) # 15 seconds TTL is highly optimal
