import asyncio
import contextlib
import hashlib
import json
import os
import sqlite3
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

try:
    from open_webui.utils.auth import get_verified_user
except Exception:  # pragma: no cover
    get_verified_user = None

try:
    import httpx
except Exception:  # pragma: no cover
    httpx = None

try:
    from connectors import RedditPublicConnector, RssConnector
except Exception:  # pragma: no cover
    RedditPublicConnector = None
    RssConnector = None

DATA_DIR = os.environ.get("PULZ_DATA_DIR", "/app/backend/data/pulz")
DB_PATH = os.path.join(DATA_DIR, "pulz.sqlite3")

SOURCE_CONFIG = {
    "reddit_smallbusiness": {
        "kind": "reddit",
        "subreddit": "smallbusiness",
    },
    "reddit_entrepreneur": {
        "kind": "reddit",
        "subreddit": "entrepreneur",
    },
    "rss_forhire": {
        "kind": "rss",
        "url": "https://www.reddit.com/r/forhire/.rss",
    },
}

KEYWORDS = [
    "need",
    "looking for",
    "is there a tool",
    "generator",
    "template",
    "lease",
    "resume",
    "pdf",
    "proposal",
    "automation",
    "integrate",
    "web app",
    "tool",
]

RISK_KEYWORDS = {
    "legal": ["legal", "law", "attorney", "contract"],
    "medical": ["medical", "health", "clinic", "patient"],
    "financial": ["loan", "investment", "tax", "accounting"],
}


@dataclass
class Signal:
    id: str
    source: str
    url: str
    title: str
    body_excerpt: str
    author: str
    created_at: str
    raw: Dict[str, Any]
    contact_hint: Optional[str]


@dataclass
class MissionState:
    running: bool = False
    started_at: Optional[str] = None
    ends_at: Optional[str] = None
    sources: List[str] = None
    rate_per_source_per_minute: float = 1.0
    max_items: int = 100
    items_processed: int = 0
    last_error: Optional[str] = None
    last_scan: Optional[str] = None
    model_calls: int = 0
    token_usage: Optional[int] = None
    token_usage_available: bool = False
    provider: Optional[str] = None


class FeedBroadcaster:
    def __init__(self) -> None:
        self.queues: List[asyncio.Queue] = []
        self.lock = asyncio.Lock()

    async def publish(self, event: Dict[str, Any]) -> None:
        async with self.lock:
            for queue in list(self.queues):
                await queue.put(event)

    async def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        async with self.lock:
            self.queues.append(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        async with self.lock:
            if queue in self.queues:
                self.queues.remove(queue)


broadcaster = FeedBroadcaster()
mission_state = MissionState(sources=[])
mission_task: Optional[asyncio.Task] = None
stop_event = asyncio.Event()

db_lock = asyncio.Lock()


def _ensure_db() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS signals (
                id TEXT PRIMARY KEY,
                source TEXT,
                url TEXT,
                title TEXT,
                body_excerpt TEXT,
                author TEXT,
                created_at TEXT,
                raw_json TEXT,
                scored_json TEXT,
                proposal_id TEXT,
                status TEXT,
                inserted_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS proposals (
                id TEXT PRIMARY KEY,
                signal_id TEXT,
                status TEXT,
                created_at TEXT,
                updated_at TEXT,
                data_json TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS artifacts (
                id TEXT PRIMARY KEY,
                proposal_id TEXT,
                created_at TEXT,
                data_json TEXT,
                text TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS missions (
                id TEXT PRIMARY KEY,
                started_at TEXT,
                ends_at TEXT,
                status TEXT,
                config_json TEXT
            )
            """
        )


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hash_id(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def _get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


async def _signal_exists(signal_id: str) -> bool:
    async with db_lock:
        with _get_db_connection() as conn:
            row = conn.execute("SELECT 1 FROM signals WHERE id = ?", (signal_id,)).fetchone()
            return row is not None


async def _insert_signal(signal: Signal, scored: Dict[str, Any], proposal_id: Optional[str]) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO signals
                (id, source, url, title, body_excerpt, author, created_at, raw_json, scored_json, proposal_id, status, inserted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    signal.id,
                    signal.source,
                    signal.url,
                    signal.title,
                    signal.body_excerpt,
                    signal.author,
                    signal.created_at,
                    json.dumps(signal.raw),
                    json.dumps(scored),
                    proposal_id,
                    "queued" if proposal_id else scored.get("recommended_next_action", "ignore"),
                    _now_iso(),
                ),
            )


async def _insert_proposal(signal_id: str, proposal: Dict[str, Any]) -> str:
    proposal_id = _hash_id(f"proposal:{signal_id}:{time.time()}")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO proposals (id, signal_id, status, created_at, updated_at, data_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    proposal_id,
                    signal_id,
                    "queued",
                    _now_iso(),
                    _now_iso(),
                    json.dumps(proposal),
                ),
            )
    return proposal_id


async def _update_proposal_status(proposal_id: str, status: str) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                UPDATE proposals
                SET status = ?, updated_at = ?
                WHERE id = ?
                """,
                (status, _now_iso(), proposal_id),
            )


async def _insert_artifact(proposal_id: str, proposal: Dict[str, Any]) -> str:
    artifact_id = _hash_id(f"artifact:{proposal_id}:{time.time()}")
    text = proposal.get("message_template", "")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO artifacts (id, proposal_id, created_at, data_json, text)
                VALUES (?, ?, ?, ?, ?)
                """,
                (artifact_id, proposal_id, _now_iso(), json.dumps(proposal), text),
            )
    return artifact_id


def _signal_from_connector(raw_signal: Any) -> Signal:
    data = asdict(raw_signal)
    signal_id = data.get("id") or _hash_id(data.get("url", ""))
    return Signal(
        id=signal_id,
        source=data.get("source", "unknown"),
        url=data.get("url", ""),
        title=data.get("title", ""),
        body_excerpt=data.get("body_excerpt", ""),
        author=data.get("author", "unknown"),
        created_at=data.get("created_at", _now_iso()),
        raw=data.get("raw", {}),
        contact_hint=data.get("contact_hint"),
    )


def _heuristic_score(text: str) -> int:
    text_lower = text.lower()
    return sum(1 for keyword in KEYWORDS if keyword in text_lower)


def _categorize(text: str) -> str:
    text_lower = text.lower()
    if any(word in text_lower for word in ["template", "pdf", "resume", "lease", "generator"]):
        return "Doc generator / template tool"
    if any(word in text_lower for word in ["automation", "integrate", "zapier", "api"]):
        return "Automation / integration request"
    if any(word in text_lower for word in ["app", "web", "saas", "tool"]):
        return "Small web app / micro SaaS"
    return "Not a lead / ignore"


def _risk_flags(text: str) -> List[str]:
    flags = []
    text_lower = text.lower()
    for label, keywords in RISK_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            flags.append(label)
    return flags


def _estimate(text: str, category: str) -> Dict[str, Any]:
    score = _heuristic_score(text)
    risk_flags = _risk_flags(text)
    if category == "Doc generator / template tool":
        base = 240
        price = "$600 - $1,500"
    elif category == "Automation / integration request":
        base = 360
        price = "$900 - $2,500"
    elif category == "Small web app / micro SaaS":
        base = 480
        price = "$1,200 - $3,500"
    else:
        base = 180
        price = "$400 - $900"
    feasibility = "HIGH" if score >= 2 and not risk_flags else "MED"
    if score <= 1:
        feasibility = "LOW"
    if risk_flags:
        feasibility = "MED"
    return {
        "feasibility": feasibility,
        "estimated_build_time_minutes": base + max(0, score - 2) * 60,
        "suggested_price_range": price,
        "risk_flags": risk_flags,
    }


async def _ollama_classify(text: str) -> Optional[Dict[str, Any]]:
    if httpx is None:
        return None
    model = os.environ.get("PULZ_OLLAMA_MODEL", "llama3.1")
    url = os.environ.get("PULZ_OLLAMA_URL", "http://host.docker.internal:11434/api/generate")
    prompt = (
        "Classify the following opportunity. Respond ONLY with JSON containing keys: "
        "category, feasibility, estimated_build_time_minutes, suggested_price_range, risk_flags, recommended_next_action, rationale. "
        "Risk flags must be array of strings.\n\n"
        f"Text: {text}"
    )
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                url,
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return None
    raw_text = payload.get("response", "")
    parsed = _parse_json_block(raw_text)
    if parsed:
        return {
            "classification": parsed,
            "usage": {
                "prompt_eval_count": payload.get("prompt_eval_count"),
                "eval_count": payload.get("eval_count"),
            },
        }
    return None


def _parse_json_block(text: str) -> Optional[Dict[str, Any]]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


def _draft_proposal(signal: Signal, scored: Dict[str, Any]) -> Dict[str, Any]:
    message = (
        "Hi there! I saw your post and can help with a fast-turnaround solution.\n\n"
        f"Summary: {signal.title}\n"
        f"Approach: {scored.get('category', 'Custom build')} with a focused scope and quick delivery.\n"
        f"Estimated delivery: {scored.get('estimated_build_time_minutes')} minutes of build time.\n"
        f"Price range: {scored.get('suggested_price_range')}.\n\n"
        "If helpful, I can outline a short scope and timeline based on your exact requirements."
    )
    return {
        "signal_id": signal.id,
        "source": signal.source,
        "problem_summary": signal.body_excerpt or signal.title,
        "solution_options": [
            "Lean MVP with core workflow and export",
            "Enhanced version with templates + automation hooks",
        ],
        "suggested_price_range": scored.get("suggested_price_range"),
        "estimated_build_time_minutes": scored.get("estimated_build_time_minutes"),
        "message_template": message,
    }


async def _score_signal(signal: Signal) -> Dict[str, Any]:
    text = f"{signal.title}\n{signal.body_excerpt}"
    category = _categorize(text)
    estimate = _estimate(text, category)
    recommended = "draft proposal" if _heuristic_score(text) >= 2 else "ignore"
    if estimate["risk_flags"]:
        recommended = "needs clarification"
    scored = {
        "category": category,
        "feasibility": estimate["feasibility"],
        "estimated_build_time_minutes": estimate["estimated_build_time_minutes"],
        "suggested_price_range": estimate["suggested_price_range"],
        "risk_flags": estimate["risk_flags"],
        "recommended_next_action": recommended,
        "rationale": "keyword heuristic",
    }

    llm = await _ollama_classify(text)
    if llm and llm.get("classification"):
        scored.update(llm["classification"])
        scored["rationale"] = "llm_assisted"
        usage = llm.get("usage", {})
        if usage.get("prompt_eval_count") or usage.get("eval_count"):
            mission_state.token_usage_available = True
            mission_state.token_usage = (usage.get("prompt_eval_count") or 0) + (usage.get("eval_count") or 0)
        mission_state.model_calls += 1
        mission_state.provider = "ollama"
    return scored


async def _process_signal(signal: Signal) -> Optional[Dict[str, Any]]:
    if await _signal_exists(signal.id):
        return None
    scored = await _score_signal(signal)
    proposal_id = None
    proposal = None
    if scored.get("recommended_next_action") == "draft proposal":
        proposal = _draft_proposal(signal, scored)
        proposal_id = await _insert_proposal(signal.id, proposal)
    await _insert_signal(signal, scored, proposal_id)
    mission_state.items_processed += 1
    if proposal_id and proposal:
        return {
            "signal": asdict(signal),
            "scoring": scored,
            "proposal": proposal,
            "status": "queued",
            "proposal_id": proposal_id,
        }
    return {
        "signal": asdict(signal),
        "scoring": scored,
        "status": scored.get("recommended_next_action"),
    }


async def _mission_loop(config: Dict[str, Any]) -> None:
    mission_state.running = True
    mission_state.started_at = _now_iso()
    mission_state.ends_at = config.get("ends_at")
    mission_state.sources = config.get("sources", [])
    mission_state.rate_per_source_per_minute = config.get("rate")
    mission_state.max_items = config.get("max_items")
    mission_state.items_processed = 0
    mission_state.last_error = None
    mission_state.model_calls = 0
    mission_state.token_usage = None
    mission_state.token_usage_available = False

    connectors: Dict[str, Any] = {}
    for source in mission_state.sources:
        cfg = SOURCE_CONFIG.get(source)
        if not cfg:
            continue
        if cfg["kind"] == "reddit" and RedditPublicConnector:
            connectors[source] = RedditPublicConnector(cfg["subreddit"])
        if cfg["kind"] == "rss" and RssConnector:
            connectors[source] = RssConnector(source, cfg["url"])

    if not connectors:
        mission_state.last_error = "No valid connectors configured"
        mission_state.running = False
        return

    await _record_mission(config)

    while not stop_event.is_set():
        now = _now_iso()
        mission_state.last_scan = now
        for name, connector in connectors.items():
            if stop_event.is_set():
                break
            try:
                signals = await connector.fetch_signals()
                for raw_signal in signals:
                    if stop_event.is_set():
                        break
                    if mission_state.items_processed >= mission_state.max_items:
                        stop_event.set()
                        break
                    signal = _signal_from_connector(raw_signal)
                    event = await _process_signal(signal)
                    if event:
                        await broadcaster.publish({"type": "signal", "data": event})
                await asyncio.sleep(max(5, 60 / mission_state.rate_per_source_per_minute))
            except Exception as exc:
                mission_state.last_error = f"{name}: {exc}"
        if mission_state.ends_at:
            ends_at = datetime.strptime(mission_state.ends_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) >= ends_at:
                stop_event.set()

    mission_state.running = False


async def _record_mission(config: Dict[str, Any]) -> None:
    mission_id = _hash_id(f"mission:{config['started_at']}")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO missions (id, started_at, ends_at, status, config_json)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    mission_id,
                    config["started_at"],
                    config["ends_at"],
                    "running",
                    json.dumps(config),
                ),
            )


def _status_payload() -> Dict[str, Any]:
    if mission_state.started_at:
        started_at = datetime.strptime(mission_state.started_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        elapsed_min = max(1, (datetime.now(timezone.utc) - started_at).total_seconds() / 60)
        items_per_min = mission_state.items_processed / elapsed_min
    else:
        items_per_min = 0
    return {
        "running": mission_state.running,
        "started_at": mission_state.started_at,
        "ends_at": mission_state.ends_at,
        "sources": mission_state.sources or [],
        "rate": mission_state.rate_per_source_per_minute,
        "max_items": mission_state.max_items,
        "items_processed": mission_state.items_processed,
        "items_per_min": round(items_per_min, 2),
        "last_error": mission_state.last_error,
        "last_scan": mission_state.last_scan,
        "model_calls": mission_state.model_calls,
        "token_usage": mission_state.token_usage,
        "token_usage_available": mission_state.token_usage_available,
        "provider": mission_state.provider,
    }


async def _list_queue() -> List[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(
                """
                SELECT proposals.id, proposals.data_json, proposals.created_at, signals.title, signals.url, signals.source
                FROM proposals
                JOIN signals ON signals.id = proposals.signal_id
                WHERE proposals.status = 'queued'
                ORDER BY proposals.created_at DESC
                """
            ).fetchall()
    return [
        {
            "id": row["id"],
            "created_at": row["created_at"],
            "proposal": json.loads(row["data_json"]),
            "source": row["source"],
            "title": row["title"],
            "url": row["url"],
        }
        for row in rows
    ]


async def _list_artifacts() -> List[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(
                """
                SELECT id, proposal_id, created_at, data_json
                FROM artifacts
                ORDER BY created_at DESC
                LIMIT 50
                """
            ).fetchall()
    return [
        {
            "id": row["id"],
            "proposal_id": row["proposal_id"],
            "created_at": row["created_at"],
            "proposal": json.loads(row["data_json"]),
        }
        for row in rows
    ]


async def _get_artifact(artifact_id: str) -> Optional[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            row = conn.execute(
                """
                SELECT id, proposal_id, created_at, data_json, text
                FROM artifacts
                WHERE id = ?
                """,
                (artifact_id,),
            ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "proposal_id": row["proposal_id"],
        "created_at": row["created_at"],
        "proposal": json.loads(row["data_json"]),
        "text": row["text"],
    }


def _auth_dependency() -> List[Depends]:
    auth_enabled = os.environ.get("WEBUI_AUTH", "false").lower() == "true"
    if not auth_enabled:
        return []
    if get_verified_user is None:
        async def reject_user():
            raise HTTPException(status_code=401, detail="Authentication required")

        return [Depends(reject_user)]

    async def require_user(user=Depends(get_verified_user)):
        if user is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        return user

    return [Depends(require_user)]


async def _sse_events() -> AsyncGenerator[str, None]:
    queue = await broadcaster.subscribe()
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=10)
                payload = event
                yield _format_sse(event.get("type", "signal"), payload.get("data", {}))
            except asyncio.TimeoutError:
                heartbeat = {
                    "running": mission_state.running,
                    "time_left": _time_left(),
                    "queue_size": len(await _list_queue()),
                }
                yield _format_sse("heartbeat", heartbeat)
    finally:
        await broadcaster.unsubscribe(queue)


def _format_sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _time_left() -> Optional[int]:
    if not mission_state.ends_at:
        return None
    ends_at = datetime.strptime(mission_state.ends_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    seconds = int((ends_at - datetime.now(timezone.utc)).total_seconds())
    return max(0, seconds)


def register(app) -> None:
    _ensure_db()
    if not any(route.path == "/pulz" for route in app.routes):
        app.mount("/pulz", StaticFiles(directory="/app/pulz-ui", html=True), name="pulz")

    router = APIRouter(prefix="/api/pulz", tags=["pulz"], dependencies=_auth_dependency())

    @router.get("/status")
    async def status() -> Dict[str, Any]:
        return _status_payload()

    @router.post("/mission/start")
    async def start_mission(payload: Dict[str, Any]) -> Dict[str, Any]:
        global mission_task
        if mission_state.running:
            raise HTTPException(status_code=409, detail="Mission already running")
        duration = int(payload.get("duration_minutes", 60))
        sources = payload.get("sources") or ["reddit_smallbusiness"]
        rate = float(payload.get("rate_per_source_per_minute", 1))
        max_items = int(payload.get("max_items", 100))
        started_at = datetime.now(timezone.utc)
        ends_at = started_at + timedelta(minutes=duration)
        config = {
            "duration_minutes": duration,
            "sources": sources,
            "rate": rate,
            "max_items": max_items,
            "started_at": started_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "ends_at": ends_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        stop_event.clear()
        mission_task = asyncio.create_task(_mission_loop(config))
        return _status_payload()

    @router.post("/mission/stop")
    async def stop_mission() -> Dict[str, Any]:
        if not mission_state.running:
            return _status_payload()
        stop_event.set()
        if mission_task:
            with contextlib.suppress(Exception):
                await mission_task
        return _status_payload()

    @router.get("/feed")
    async def feed(request: Request) -> StreamingResponse:
        async def event_stream() -> AsyncGenerator[str, None]:
            async for event in _sse_events():
                if await request.is_disconnected():
                    break
                yield event

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    @router.get("/queue")
    async def queue() -> JSONResponse:
        items = await _list_queue()
        return JSONResponse({"items": items})

    @router.post("/queue/{proposal_id}/approve")
    async def approve(proposal_id: str) -> Dict[str, Any]:
        async with db_lock:
            with _get_db_connection() as conn:
                row = conn.execute(
                    "SELECT data_json FROM proposals WHERE id = ?", (proposal_id,)
                ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal not found")
        proposal = json.loads(row["data_json"])
        await _update_proposal_status(proposal_id, "approved")
        artifact_id = await _insert_artifact(proposal_id, proposal)
        return {"status": "approved", "artifact_id": artifact_id}

    @router.post("/queue/{proposal_id}/reject")
    async def reject(proposal_id: str) -> Dict[str, Any]:
        await _update_proposal_status(proposal_id, "rejected")
        return {"status": "rejected"}

    @router.get("/artifacts")
    async def artifacts() -> JSONResponse:
        items = await _list_artifacts()
        return JSONResponse({"items": items})

    @router.get("/artifacts/{artifact_id}")
    async def artifact(artifact_id: str, format: Optional[str] = None):
        item = await _get_artifact(artifact_id)
        if not item:
            raise HTTPException(status_code=404, detail="Artifact not found")
        if format == "text":
            return PlainTextResponse(item.get("text", ""))
        return JSONResponse(item)

    app.include_router(router)
