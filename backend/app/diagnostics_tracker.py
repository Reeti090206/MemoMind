import time
from typing import List

class DiagnosticsTracker:
    def __init__(self):
        self.response_times: List[float] = []
        self.cache_hits = 0
        self.cache_misses = 0
        self.max_response_times_history = 50

    def track_response_time(self, duration: float):
        self.response_times.append(duration)
        if len(self.response_times) > self.max_response_times_history:
            self.response_times.pop(0)

    def track_cache_hit(self):
        self.cache_hits += 1

    def track_cache_miss(self):
        self.cache_misses += 1

    @property
    def average_response_time_ms(self) -> float:
        if not self.response_times:
            return 0.0
        return round((sum(self.response_times) / len(self.response_times)) * 1000, 2)

    @property
    def cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return round((self.cache_hits / total) * 100, 2)

# Global tracker instance
diagnostics_tracker = DiagnosticsTracker()
