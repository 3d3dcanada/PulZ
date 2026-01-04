import asyncio
import json
import time
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

USER_AGENT = "PulZOpportunityEngine/1.0 (+https://pulz.local)"


@dataclass
class RedditSignal:
    id: str
    source: str
    url: str
    title: str
    body_excerpt: str
    author: str
    created_at: str
    raw: Dict[str, Any]
    contact_hint: Optional[str]


class RedditPublicConnector:
    def __init__(self, subreddit: str, limit: int = 20) -> None:
        self.subreddit = subreddit
        self.limit = limit
        self.etag: Optional[str] = None
        self.last_modified: Optional[str] = None

    async def fetch_signals(self) -> List[RedditSignal]:
        return await asyncio.to_thread(self._fetch_sync)

    def _fetch_sync(self) -> List[RedditSignal]:
        url = f"https://www.reddit.com/r/{self.subreddit}/new.json?limit={self.limit}"
        headers = {"User-Agent": USER_AGENT}
        if self.etag:
            headers["If-None-Match"] = self.etag
        if self.last_modified:
            headers["If-Modified-Since"] = self.last_modified
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                if response.status == 304:
                    return []
                self.etag = response.headers.get("ETag")
                self.last_modified = response.headers.get("Last-Modified")
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 304:
                return []
            raise
        items = []
        now = time.time()
        children = payload.get("data", {}).get("children", [])
        for child in children:
            data = child.get("data", {})
            created = data.get("created_utc") or now
            created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(created))
            url = data.get("url") or f"https://www.reddit.com{data.get('permalink', '')}"
            body = (data.get("selftext") or "").strip()
            items.append(
                RedditSignal(
                    id=data.get("id", ""),
                    source=f"reddit:r/{self.subreddit}",
                    url=url,
                    title=(data.get("title") or "").strip(),
                    body_excerpt=body[:400],
                    author=data.get("author") or "unknown",
                    created_at=created_at,
                    raw=data,
                    contact_hint=data.get("author") or None,
                )
            )
        return items
