import asyncio
import time
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

USER_AGENT = "PulZOpportunityEngine/1.0 (+https://pulz.local)"


@dataclass
class RssSignal:
    id: str
    source: str
    url: str
    title: str
    body_excerpt: str
    author: str
    created_at: str
    raw: Dict[str, Any]
    contact_hint: Optional[str]


class RssConnector:
    def __init__(self, name: str, feed_url: str) -> None:
        self.name = name
        self.feed_url = feed_url
        self.etag: Optional[str] = None
        self.last_modified: Optional[str] = None

    async def fetch_signals(self) -> List[RssSignal]:
        return await asyncio.to_thread(self._fetch_sync)

    def _fetch_sync(self) -> List[RssSignal]:
        headers = {"User-Agent": USER_AGENT}
        if self.etag:
            headers["If-None-Match"] = self.etag
        if self.last_modified:
            headers["If-Modified-Since"] = self.last_modified
        request = urllib.request.Request(self.feed_url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status == 304:
                    return []
                self.etag = response.headers.get("ETag")
                self.last_modified = response.headers.get("Last-Modified")
                data = response.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 304:
                return []
            raise
        root = ET.fromstring(data)
        items: List[RssSignal] = []
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        channel = root.find("channel")
        if channel is None:
            entries = root.findall("{http://www.w3.org/2005/Atom}entry")
            for entry in entries:
                title = _text(entry, "{http://www.w3.org/2005/Atom}title")
                link = entry.find("{http://www.w3.org/2005/Atom}link")
                url = link.attrib.get("href") if link is not None else ""
                author = _text(entry, "{http://www.w3.org/2005/Atom}author/{http://www.w3.org/2005/Atom}name")
                summary = _text(entry, "{http://www.w3.org/2005/Atom}summary")
                updated = _text(entry, "{http://www.w3.org/2005/Atom}updated") or now
                entry_id = _text(entry, "{http://www.w3.org/2005/Atom}id") or url
                items.append(
                    RssSignal(
                        id=entry_id,
                        source=f"rss:{self.name}",
                        url=url,
                        title=title,
                        body_excerpt=summary[:400],
                        author=author or "unknown",
                        created_at=updated,
                        raw={"title": title, "url": url, "summary": summary},
                        contact_hint=author or None,
                    )
                )
        else:
            for item in channel.findall("item"):
                title = _text(item, "title")
                url = _text(item, "link")
                description = _text(item, "description")
                author = _text(item, "author") or _text(item, "dc:creator")
                pub_date = _text(item, "pubDate") or now
                guid = _text(item, "guid") or url
                items.append(
                    RssSignal(
                        id=guid,
                        source=f"rss:{self.name}",
                        url=url,
                        title=title,
                        body_excerpt=description[:400],
                        author=author or "unknown",
                        created_at=pub_date,
                        raw={"title": title, "url": url, "summary": description},
                        contact_hint=author or None,
                    )
                )
        return items


def _text(node: Optional[ET.Element], path: str) -> str:
    if node is None:
        return ""
    child = node.find(path)
    if child is None:
        return ""
    return (child.text or "").strip()
