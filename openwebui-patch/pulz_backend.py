import asyncio
import contextlib
import hashlib
import json
import os
import sqlite3
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, StreamingResponse
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

from pulz_executors import EXECUTORS, ExecutorOutcome

DATA_DIR = os.environ.get("PULZ_DATA_DIR", "/app/backend/data/pulz")
DB_PATH = os.path.join(DATA_DIR, "pulz.sqlite3")
ARTIFACTS_DIR = os.path.join(DATA_DIR, "artifacts")
EXECUTION_OUTPUT_DIR = os.path.join(ARTIFACTS_DIR, "executions")


def _load_cost_config() -> Dict[str, float]:
    raw = os.environ.get("PULZ_COST_PER_1M_TOKENS_USD")
    if not raw:
        return {"default": 2.0}
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return {key: float(value) for key, value in parsed.items()}
        return {"default": float(parsed)}
    except (json.JSONDecodeError, ValueError):
        return {"default": 2.0}


COST_PER_1M_TOKENS_USD = _load_cost_config()

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
    current_mission_id: Optional[str] = None
    authority_mode: str = "auto_draft_queue"
    execution_blocked: bool = False


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
execution_lock = asyncio.Lock()
execution_tasks: Dict[str, asyncio.Task] = {}
execution_cancellations: Dict[str, asyncio.Event] = {}


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def _ensure_db() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    os.makedirs(EXECUTION_OUTPUT_DIR, exist_ok=True)
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                proposal_id TEXT,
                mission_id TEXT,
                lane TEXT,
                status TEXT,
                started_at TEXT,
                finished_at TEXT,
                approved_by TEXT,
                inputs_json TEXT,
                outputs_json TEXT,
                logs_text TEXT,
                error TEXT,
                metrics_json TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS telemetry_events (
                id TEXT PRIMARY KEY,
                ts TEXT,
                mission_id TEXT,
                proposal_id TEXT,
                execution_id TEXT,
                type TEXT,
                payload_json TEXT
            )
            """
        )
        _ensure_column(conn, "proposals", "approved_at", "TEXT")
        _ensure_column(conn, "proposals", "executing_at", "TEXT")
        _ensure_column(conn, "proposals", "executed_at", "TEXT")
        _ensure_column(conn, "proposals", "execution_mode", "TEXT")
        _ensure_column(conn, "proposals", "estimated_revenue_cents", "INTEGER")
        _ensure_column(conn, "proposals", "realized_revenue_cents", "INTEGER")
        _ensure_column(conn, "proposals", "mission_id", "TEXT")
        _ensure_column(conn, "artifacts", "execution_id", "TEXT")
        _ensure_column(conn, "artifacts", "kind", "TEXT")
        _ensure_column(conn, "artifacts", "path", "TEXT")
        _ensure_column(conn, "artifacts", "sha256", "TEXT")
        _ensure_column(conn, "missions", "authority_mode", "TEXT")


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _estimate_tokens(text: str) -> int:
    return max(1, int(len(text) / 4))


def _hash_id(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def _get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


async def _record_telemetry(
    event_type: str,
    payload: Dict[str, Any],
    mission_id: Optional[str] = None,
    proposal_id: Optional[str] = None,
    execution_id: Optional[str] = None,
) -> None:
    event_id = _hash_id(f"telemetry:{event_type}:{time.time()}:{uuid.uuid4().hex}")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO telemetry_events (id, ts, mission_id, proposal_id, execution_id, type, payload_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    _now_iso(),
                    mission_id,
                    proposal_id,
                    execution_id,
                    event_type,
                    json.dumps(payload),
                ),
            )


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


async def _insert_proposal(
    signal_id: str,
    proposal: Dict[str, Any],
    status: str,
    mission_id: Optional[str],
    execution_mode: str,
) -> str:
    proposal_id = _hash_id(f"proposal:{signal_id}:{time.time()}")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO proposals
                (id, signal_id, status, created_at, updated_at, data_json, execution_mode, mission_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proposal_id,
                    signal_id,
                    status,
                    _now_iso(),
                    _now_iso(),
                    json.dumps(proposal),
                    execution_mode,
                    mission_id,
                ),
            )
    return proposal_id


async def _update_proposal_status(proposal_id: str, status: str) -> None:
    updates = {"status": status, "updated_at": _now_iso()}
    if status == "approved":
        updates["approved_at"] = _now_iso()
    if status == "executing":
        updates["executing_at"] = _now_iso()
    if status in {"executed", "failed", "cancelled"}:
        updates["executed_at"] = _now_iso()
    async with db_lock:
        with _get_db_connection() as conn:
            columns = ", ".join([f"{key} = ?" for key in updates.keys()])
            values = list(updates.values()) + [proposal_id]
            conn.execute(f"UPDATE proposals SET {columns} WHERE id = ?", values)


async def _insert_artifact(
    proposal_id: str,
    proposal: Dict[str, Any],
    execution_id: Optional[str] = None,
    kind: Optional[str] = None,
    path: Optional[str] = None,
    sha256: Optional[str] = None,
) -> str:
    artifact_id = _hash_id(f"artifact:{proposal_id}:{time.time()}")
    text = proposal.get("message_template", "")
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO artifacts
                (id, proposal_id, created_at, data_json, text, execution_id, kind, path, sha256)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    artifact_id,
                    proposal_id,
                    _now_iso(),
                    json.dumps(proposal),
                    text,
                    execution_id,
                    kind,
                    path,
                    sha256,
                ),
            )
    return artifact_id


async def _insert_execution(
    proposal_id: str,
    mission_id: Optional[str],
    lane: str,
    status: str,
    approved_by: Optional[str],
    inputs: Dict[str, Any],
) -> str:
    execution_id = str(uuid.uuid4())
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO executions
                (id, proposal_id, mission_id, lane, status, started_at, approved_by, inputs_json, outputs_json, logs_text, metrics_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    execution_id,
                    proposal_id,
                    mission_id,
                    lane,
                    status,
                    _now_iso(),
                    approved_by,
                    json.dumps(inputs),
                    json.dumps({}),
                    "",
                    json.dumps({}),
                ),
            )
    return execution_id


async def _update_execution_status(execution_id: str, status: str, error: Optional[str] = None) -> None:
    updates = {"status": status}
    if status in {"succeeded", "failed", "cancelled"}:
        updates["finished_at"] = _now_iso()
    if error:
        updates["error"] = error
    async with db_lock:
        with _get_db_connection() as conn:
            columns = ", ".join([f"{key} = ?" for key in updates.keys()])
            values = list(updates.values()) + [execution_id]
            conn.execute(f"UPDATE executions SET {columns} WHERE id = ?", values)


async def _append_execution_log(execution_id: str, line: str) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            row = conn.execute("SELECT logs_text FROM executions WHERE id = ?", (execution_id,)).fetchone()
            logs = (row["logs_text"] if row else "") or ""
            logs = f"{logs}{line}\n"
            conn.execute("UPDATE executions SET logs_text = ? WHERE id = ?", (logs, execution_id))


async def _update_execution_outputs(execution_id: str, outputs: Dict[str, Any]) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                "UPDATE executions SET outputs_json = ? WHERE id = ?",
                (json.dumps(outputs), execution_id),
            )


async def _update_execution_metrics(execution_id: str, metrics: Dict[str, Any]) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            conn.execute(
                "UPDATE executions SET metrics_json = ? WHERE id = ?",
                (json.dumps(metrics), execution_id),
            )


async def _get_execution(execution_id: str) -> Optional[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            row = conn.execute("SELECT * FROM executions WHERE id = ?", (execution_id,)).fetchone()
            if not row:
                return None
            return dict(row)


async def _list_execution_artifacts(execution_id: str) -> List[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(
                """
                SELECT id, proposal_id, execution_id, created_at, kind, path, sha256, data_json
                FROM artifacts
                WHERE execution_id = ?
                ORDER BY created_at DESC
                """,
                (execution_id,),
            ).fetchall()
    return [
        {
            "id": row["id"],
            "proposal_id": row["proposal_id"],
            "execution_id": row["execution_id"],
            "created_at": row["created_at"],
            "kind": row["kind"],
            "path": row["path"],
            "sha256": row["sha256"],
            "data": json.loads(row["data_json"]) if row["data_json"] else None,
        }
        for row in rows
    ]


async def _list_executions(
    statuses: Optional[List[str]] = None,
    lane: Optional[str] = None,
    mission_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query = "SELECT * FROM executions WHERE 1=1"
    params: List[Any] = []
    if statuses:
        placeholders = ", ".join(["?"] * len(statuses))
        query += f" AND status IN ({placeholders})"
        params.extend(statuses)
    if lane:
        query += " AND lane = ?"
        params.append(lane)
    if mission_id:
        query += " AND mission_id = ?"
        params.append(mission_id)
    query += " ORDER BY started_at DESC"
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


async def _telemetry_summary() -> Dict[str, Any]:
    async with db_lock:
        with _get_db_connection() as conn:
            token_rows = conn.execute(
                "SELECT ts, payload_json FROM telemetry_events WHERE type = 'tokens_used'"
            ).fetchall()
            signal_rows = conn.execute(
                "SELECT payload_json FROM telemetry_events WHERE type = 'connector_item'"
            ).fetchall()
            proposal_rows = conn.execute(
                "SELECT payload_json FROM telemetry_events WHERE type = 'proposal_created'"
            ).fetchall()
            execution_rows = conn.execute(
                "SELECT payload_json FROM telemetry_events WHERE type = 'execution_started'"
            ).fetchall()
            proposal_revenue = conn.execute(
                """
                SELECT proposals.realized_revenue_cents, signals.source
                FROM proposals
                JOIN signals ON signals.id = proposals.signal_id
                """
            ).fetchall()
            signal_sources = conn.execute("SELECT source FROM signals").fetchall()
    total_tokens = 0
    total_cost_usd = 0.0
    tokens_over_time: Dict[str, int] = {}
    for row in token_rows:
        payload = json.loads(row["payload_json"])
        tokens = int(payload.get("tokens", 0))
        provider = payload.get("provider") or "default"
        rate = COST_PER_1M_TOKENS_USD.get(provider, COST_PER_1M_TOKENS_USD.get("default", 0.0))
        total_tokens += tokens
        total_cost_usd += (tokens / 1_000_000) * rate
        hour = row["ts"][:13] + ":00:00Z"
        tokens_over_time[hour] = tokens_over_time.get(hour, 0) + tokens
    signal_count = len(signal_rows)
    proposal_count = len(proposal_rows)
    execution_count = len(execution_rows)
    cost_per_signal = total_cost_usd / signal_count if signal_count else 0
    cost_per_proposal = total_cost_usd / proposal_count if proposal_count else 0
    cost_per_execution = total_cost_usd / execution_count if execution_count else 0

    source_counts: Dict[str, int] = {}
    for row in signal_sources:
        source_counts[row["source"]] = source_counts.get(row["source"], 0) + 1

    revenue_by_source: Dict[str, int] = {}
    for row in proposal_revenue:
        if row["realized_revenue_cents"] is None:
            continue
        revenue_by_source[row["source"]] = revenue_by_source.get(row["source"], 0) + int(
            row["realized_revenue_cents"]
        )

    roi_by_source = []
    for source, count in source_counts.items():
        cost_usd = cost_per_signal * count
        revenue_cents = revenue_by_source.get(source)
        roi_entry = {
            "source": source,
            "signals": count,
            "cost_usd": round(cost_usd, 4),
            "revenue_cents": revenue_cents,
            "roi": None,
            "unrealized": revenue_cents is None,
        }
        if revenue_cents is not None and cost_usd > 0:
            roi_entry["roi"] = round((revenue_cents / 100) / cost_usd, 4)
        roi_by_source.append(roi_entry)

    return {
        "tokens_over_time": [
            {"ts": ts, "tokens": tokens} for ts, tokens in sorted(tokens_over_time.items())
        ],
        "total_tokens": total_tokens,
        "total_cost_usd": round(total_cost_usd, 4),
        "cost_per_signal": round(cost_per_signal, 4),
        "cost_per_proposal": round(cost_per_proposal, 4),
        "cost_per_execution": round(cost_per_execution, 4),
        "roi_by_source": roi_by_source,
        "config": {"cost_per_1m_tokens_usd": COST_PER_1M_TOKENS_USD},
    }


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
    contact_method = {"channel": "unknown", "handle": signal.author, "link": signal.url}
    if signal.source.startswith("reddit:"):
        contact_method = {"channel": "reddit", "handle": signal.author, "permalink": signal.url}
    elif signal.source.startswith("rss:"):
        contact_method = {"channel": "rss", "author": signal.author, "url": signal.url}
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
        "contact_method": contact_method,
    }


async def _score_signal(signal: Signal) -> Dict[str, Any]:
    text = f"{signal.title}\n{signal.body_excerpt}"
    category = _categorize(text)
    estimate = _estimate(text, category)
    recommended = "draft proposal" if _heuristic_score(text) >= 2 else "ignore"
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
        tokens_used = (usage.get("prompt_eval_count") or 0) + (usage.get("eval_count") or 0)
        if tokens_used:
            await _record_telemetry(
                "tokens_used",
                {"tokens": tokens_used, "provider": mission_state.provider},
                mission_id=mission_state.current_mission_id,
            )
        await _record_telemetry(
            "model_call",
            {"provider": mission_state.provider},
            mission_id=mission_state.current_mission_id,
        )
    else:
        estimated_tokens = _estimate_tokens(text)
        await _record_telemetry(
            "tokens_used",
            {"tokens": estimated_tokens, "provider": "estimate"},
            mission_id=mission_state.current_mission_id,
        )
    if scored.get("risk_flags"):
        scored["recommended_next_action"] = "needs clarification"
    return scored


async def _process_signal(signal: Signal) -> Optional[Dict[str, Any]]:
    if await _signal_exists(signal.id):
        return None
    scored = await _score_signal(signal)
    await _record_telemetry(
        "connector_item",
        {"source": signal.source, "signal_id": signal.id},
        mission_id=mission_state.current_mission_id,
    )
    proposal_id = None
    proposal = None
    authority_mode = mission_state.authority_mode
    if scored.get("recommended_next_action") == "draft proposal" and authority_mode != "scan_only":
        proposal = _draft_proposal(signal, scored)
        proposal_status = "draft" if authority_mode == "draft_only" else "queued"
        execution_mode = "auto_after_approval" if authority_mode == "execute_after_approval" else "manual"
        proposal_id = await _insert_proposal(
            signal.id,
            proposal,
            proposal_status,
            mission_state.current_mission_id,
            execution_mode,
        )
        await _record_telemetry(
            "proposal_created",
            {"source": signal.source, "proposal_id": proposal_id, "status": proposal_status},
            mission_id=mission_state.current_mission_id,
            proposal_id=proposal_id,
        )
    await _insert_signal(signal, scored, proposal_id)
    mission_state.items_processed += 1
    if proposal_id and proposal:
        return {
            "signal": asdict(signal),
            "scoring": scored,
            "proposal": proposal,
            "status": proposal_status,
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
    mission_state.authority_mode = config.get("authority_mode", mission_state.authority_mode)
    mission_state.execution_blocked = False

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
                INSERT INTO missions (id, started_at, ends_at, status, config_json, authority_mode)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    mission_id,
                    config["started_at"],
                    config["ends_at"],
                    "running",
                    json.dumps(config),
                    config.get("authority_mode"),
                ),
            )
    mission_state.current_mission_id = mission_id


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
        "mission_id": mission_state.current_mission_id,
        "authority_mode": mission_state.authority_mode,
        "execution_blocked": mission_state.execution_blocked,
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


async def _list_proposals(statuses: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    query = """
        SELECT proposals.id,
               proposals.status,
               proposals.created_at,
               proposals.updated_at,
               proposals.approved_at,
               proposals.executing_at,
               proposals.executed_at,
               proposals.execution_mode,
               proposals.estimated_revenue_cents,
               proposals.realized_revenue_cents,
               proposals.mission_id,
               proposals.data_json,
               signals.title,
               signals.url,
               signals.source
        FROM proposals
        JOIN signals ON signals.id = proposals.signal_id
    """
    params: List[Any] = []
    if statuses:
        placeholders = ", ".join(["?"] * len(statuses))
        query += f" WHERE proposals.status IN ({placeholders})"
        params.extend(statuses)
    query += " ORDER BY proposals.created_at DESC"
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(query, params).fetchall()
    return [
        {
            "id": row["id"],
            "status": row["status"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "approved_at": row["approved_at"],
            "executing_at": row["executing_at"],
            "executed_at": row["executed_at"],
            "execution_mode": row["execution_mode"],
            "estimated_revenue_cents": row["estimated_revenue_cents"],
            "realized_revenue_cents": row["realized_revenue_cents"],
            "mission_id": row["mission_id"],
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
                SELECT id, proposal_id, execution_id, created_at, data_json, kind, path, sha256
                FROM artifacts
                ORDER BY created_at DESC
                LIMIT 50
                """
            ).fetchall()
    return [
        {
            "id": row["id"],
            "proposal_id": row["proposal_id"],
            "execution_id": row["execution_id"],
            "created_at": row["created_at"],
            "proposal": json.loads(row["data_json"]),
            "kind": row["kind"],
            "path": row["path"],
            "sha256": row["sha256"],
        }
        for row in rows
    ]


async def _get_artifact(artifact_id: str) -> Optional[Dict[str, Any]]:
    async with db_lock:
        with _get_db_connection() as conn:
            row = conn.execute(
                """
                SELECT id, proposal_id, execution_id, created_at, data_json, text, kind, path, sha256
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
        "execution_id": row["execution_id"],
        "created_at": row["created_at"],
        "proposal": json.loads(row["data_json"]),
        "text": row["text"],
        "kind": row["kind"],
        "path": row["path"],
        "sha256": row["sha256"],
    }


def _user_identity(user: Any) -> Optional[str]:
    if user is None:
        return None
    if isinstance(user, dict):
        return str(user.get("id") or user.get("email") or user.get("name") or "unknown")
    return str(getattr(user, "id", None) or getattr(user, "email", None) or getattr(user, "name", None) or "unknown")


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


async def _emit_execution_event(
    event_type: str,
    proposal_id: str,
    execution_id: str,
    lane: str,
    status: str,
    payload: Dict[str, Any],
    mission_id: Optional[str] = None,
) -> None:
    event_payload = {
        "ts": _now_iso(),
        "mission_id": mission_id,
        "proposal_id": proposal_id,
        "execution_id": execution_id,
        "lane": lane,
        "status": status,
        "payload": payload,
    }
    await broadcaster.publish({"type": event_type, "data": event_payload})
    if event_type in {"execution_started", "execution_finished", "execution_failed", "execution_cancelled"}:
        await _record_telemetry(event_type, event_payload, mission_id, proposal_id, execution_id)


def _format_sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _time_left() -> Optional[int]:
    if not mission_state.ends_at:
        return None
    ends_at = datetime.strptime(mission_state.ends_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    seconds = int((ends_at - datetime.now(timezone.utc)).total_seconds())
    return max(0, seconds)


async def _run_execution(
    execution_id: str,
    proposal: Dict[str, Any],
    proposal_id: str,
    lane: str,
    mission_id: Optional[str],
    cancel_event: asyncio.Event,
) -> None:
    executor = EXECUTORS[lane]

    async def emit(event_type: str, status: str, payload: Dict[str, Any]) -> None:
        await _append_execution_log(execution_id, payload.get("message", event_type))
        await _emit_execution_event(event_type, proposal_id, execution_id, lane, status, payload, mission_id)

    try:
        started_at = time.monotonic()
        await _update_execution_status(execution_id, "running")
        await _update_proposal_status(proposal_id, "executing")
        await emit("execution_started", "running", {"message": "Execution started"})
        plan = executor.plan(proposal, {"mission_id": mission_id})
        base_metrics = {"plan": plan}
        await _update_execution_metrics(execution_id, base_metrics)
        outcome: ExecutorOutcome = await executor.run(
            execution_id,
            proposal,
            {
                "mission_id": mission_id,
                "cancel_event": cancel_event,
                "output_dir": EXECUTION_OUTPUT_DIR,
            },
            emit,
        )
        await _update_execution_outputs(execution_id, outcome.outputs)
        elapsed_seconds = round(time.monotonic() - started_at, 2)
        combined_metrics = {**base_metrics, **outcome.metrics, "elapsed_seconds": elapsed_seconds}
        await _update_execution_metrics(execution_id, combined_metrics)
        for artifact in outcome.artifacts:
            await _insert_artifact(
                proposal_id,
                proposal,
                execution_id=execution_id,
                kind=artifact["kind"],
                path=artifact["path"],
                sha256=artifact.get("sha256"),
            )
            await emit(
                "execution_artifact",
                "running",
                {"message": f"Artifact {artifact['kind']} stored", "artifact": artifact},
            )
        await _update_execution_status(execution_id, "succeeded")
        await _update_proposal_status(proposal_id, "executed")
        await emit("execution_finished", "succeeded", {"message": "Execution finished"})
    except asyncio.CancelledError:
        await _update_execution_status(execution_id, "cancelled")
        await _update_proposal_status(proposal_id, "cancelled")
        await emit("execution_cancelled", "cancelled", {"message": "Execution cancelled"})
    except Exception as exc:
        await _update_execution_status(execution_id, "failed", error=str(exc))
        await _update_proposal_status(proposal_id, "failed")
        await emit("execution_failed", "failed", {"message": str(exc)})


async def _start_execution_task(
    proposal_id: str,
    proposal: Dict[str, Any],
    lane: str,
    mission_id: Optional[str],
    approved_by: Optional[str],
) -> str:
    if mission_state.execution_blocked:
        raise HTTPException(status_code=409, detail="Execution blocked by mission kill switch")
    cancel_event = asyncio.Event()
    execution_id = await _insert_execution(
        proposal_id=proposal_id,
        mission_id=mission_id,
        lane=lane,
        status="queued",
        approved_by=approved_by,
        inputs={"proposal": proposal},
    )
    await _record_telemetry(
        "execution_queued",
        {"status": "queued", "lane": lane},
        mission_id=mission_id,
        proposal_id=proposal_id,
        execution_id=execution_id,
    )
    await _emit_execution_event(
        "execution_queued",
        proposal_id,
        execution_id,
        lane,
        "queued",
        {"message": "Execution queued"},
        mission_id,
    )
    async with execution_lock:
        execution_cancellations[execution_id] = cancel_event
        execution_tasks[execution_id] = asyncio.create_task(
            _run_execution(execution_id, proposal, proposal_id, lane, mission_id, cancel_event)
        )
    return execution_id


async def _cancel_running_executions(mission_id: Optional[str]) -> None:
    async with db_lock:
        with _get_db_connection() as conn:
            rows = conn.execute(
                """
                SELECT id, proposal_id, lane
                FROM executions
                WHERE status = 'running' AND (? IS NULL OR mission_id = ?)
                """,
                (mission_id, mission_id),
            ).fetchall()
    for row in rows:
        await _cancel_execution(row["id"])


async def _cancel_execution(execution_id: str) -> None:
    async with execution_lock:
        cancel_event = execution_cancellations.get(execution_id)
        task = execution_tasks.get(execution_id)
    if cancel_event:
        cancel_event.set()
    if task:
        task.cancel()


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
        duration_hours = payload.get("duration_hours")
        if duration_hours is not None:
            duration = int(duration_hours) * 60
        else:
            duration = int(payload.get("duration_minutes", 60))
        sources = payload.get("sources") or ["reddit_smallbusiness"]
        rate = float(payload.get("rate_per_source_per_minute", 1))
        max_items = int(payload.get("max_items", 100))
        authority_mode = payload.get("authority_mode", mission_state.authority_mode)
        if authority_mode not in {"scan_only", "draft_only", "auto_draft_queue", "execute_after_approval"}:
            raise HTTPException(status_code=400, detail="Invalid authority mode")
        started_at = datetime.now(timezone.utc)
        ends_at = started_at + timedelta(minutes=duration)
        config = {
            "duration_minutes": duration,
            "sources": sources,
            "rate": rate,
            "max_items": max_items,
            "started_at": started_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "ends_at": ends_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "authority_mode": authority_mode,
        }
        mission_state.execution_blocked = False
        stop_event.clear()
        mission_task = asyncio.create_task(_mission_loop(config))
        return _status_payload()

    @router.post("/mission/stop")
    async def stop_mission() -> Dict[str, Any]:
        if not mission_state.running:
            return _status_payload()
        stop_event.set()
        mission_state.execution_blocked = True
        await _cancel_running_executions(mission_state.current_mission_id)
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

    @router.get("/proposals")
    async def proposals(status: Optional[str] = None) -> JSONResponse:
        statuses = status.split(",") if status else None
        items = await _list_proposals(statuses)
        return JSONResponse({"items": items})

    @router.post("/queue/{proposal_id}/approve")
    async def approve(proposal_id: str) -> Dict[str, Any]:
        async with db_lock:
            with _get_db_connection() as conn:
                row = conn.execute(
                    "SELECT data_json, status, mission_id, execution_mode FROM proposals WHERE id = ?",
                    (proposal_id,),
                ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal not found")
        proposal = json.loads(row["data_json"])
        await _update_proposal_status(proposal_id, "approved")
        artifact_id = await _insert_artifact(proposal_id, proposal, kind="json")
        await _record_telemetry(
            "proposal_approved",
            {"proposal_id": proposal_id},
            mission_id=row["mission_id"],
            proposal_id=proposal_id,
        )
        execution_id = None
        execution_mode = row["execution_mode"] or "manual"
        if execution_mode == "auto_after_approval":
            try:
                execution_id = await _start_execution_task(
                    proposal_id,
                    proposal,
                    "html",
                    row["mission_id"],
                    approved_by="operator",
                )
            except HTTPException:
                execution_id = None
        return {"status": "approved", "artifact_id": artifact_id, "execution_id": execution_id}

    @router.post("/queue/{proposal_id}/reject")
    async def reject(proposal_id: str) -> Dict[str, Any]:
        await _update_proposal_status(proposal_id, "cancelled")
        return {"status": "cancelled"}

    @router.post("/proposals/{proposal_id}/execute")
    async def execute(proposal_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        lane = payload.get("lane", "html")
        allow_rerun = bool(payload.get("allow_rerun", False))
        if lane not in EXECUTORS:
            raise HTTPException(status_code=400, detail="Invalid execution lane")
        async with db_lock:
            with _get_db_connection() as conn:
                row = conn.execute(
                    "SELECT data_json, status, mission_id FROM proposals WHERE id = ?", (proposal_id,)
                ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal not found")
        status = row["status"]
        if status != "approved" and not (status == "executed" and allow_rerun):
            raise HTTPException(status_code=409, detail="Proposal not approved for execution")
        proposal = json.loads(row["data_json"])
        execution_id = await _start_execution_task(
            proposal_id,
            proposal,
            lane,
            row["mission_id"],
            approved_by="operator",
        )
        return {"status": "queued", "execution_id": execution_id}

    @router.post("/executions/{execution_id}/cancel")
    async def cancel_execution(execution_id: str) -> Dict[str, Any]:
        execution = await _get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        if execution["status"] in {"succeeded", "failed", "cancelled"}:
            return {"status": execution["status"]}
        await _cancel_execution(execution_id)
        await _update_execution_status(execution_id, "cancelled")
        await _update_proposal_status(execution["proposal_id"], "cancelled")
        await _emit_execution_event(
            "execution_cancelled",
            execution["proposal_id"],
            execution_id,
            execution["lane"],
            "cancelled",
            {"message": "Execution cancelled"},
            execution["mission_id"],
        )
        return {"status": "cancelled"}

    @router.get("/executions")
    async def executions(
        status: Optional[str] = None, lane: Optional[str] = None, mission_id: Optional[str] = None
    ) -> JSONResponse:
        statuses = status.split(",") if status else None
        items = await _list_executions(statuses=statuses, lane=lane, mission_id=mission_id)
        return JSONResponse({"items": items})

    @router.get("/executions/{execution_id}")
    async def execution_detail(execution_id: str) -> JSONResponse:
        execution = await _get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        artifacts = await _list_execution_artifacts(execution_id)
        return JSONResponse({"execution": execution, "artifacts": artifacts})

    @router.get("/telemetry/summary")
    async def telemetry_summary() -> JSONResponse:
        summary = await _telemetry_summary()
        return JSONResponse(summary)

    @router.get("/missions/{mission_id}/authority")
    async def get_authority(mission_id: str) -> JSONResponse:
        async with db_lock:
            with _get_db_connection() as conn:
                row = conn.execute(
                    "SELECT authority_mode FROM missions WHERE id = ?",
                    (mission_id,),
                ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Mission not found")
        return JSONResponse({"mission_id": mission_id, "authority_mode": row["authority_mode"]})

    @router.post("/missions/{mission_id}/authority")
    async def set_authority(mission_id: str, payload: Dict[str, Any]) -> JSONResponse:
        authority_mode = payload.get("authority_mode")
        if authority_mode not in {"scan_only", "draft_only", "auto_draft_queue", "execute_after_approval"}:
            raise HTTPException(status_code=400, detail="Invalid authority mode")
        async with db_lock:
            with _get_db_connection() as conn:
                conn.execute(
                    "UPDATE missions SET authority_mode = ? WHERE id = ?",
                    (authority_mode, mission_id),
                )
        if mission_state.current_mission_id == mission_id:
            mission_state.authority_mode = authority_mode
        return JSONResponse({"mission_id": mission_id, "authority_mode": authority_mode})

    @router.get("/artifacts")
    async def artifacts() -> JSONResponse:
        items = await _list_artifacts()
        return JSONResponse({"items": items})

    @router.get("/artifacts/{artifact_id}")
    async def artifact(artifact_id: str, format: Optional[str] = None):
        item = await _get_artifact(artifact_id)
        if not item:
            raise HTTPException(status_code=404, detail="Artifact not found")
        if format == "download":
            path = item.get("path")
            if not path:
                raise HTTPException(status_code=404, detail="Artifact file not found")
            file_path = Path(path)
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Artifact file missing on disk")
            return FileResponse(file_path)
        if format == "text":
            return PlainTextResponse(item.get("text", ""))
        return JSONResponse(item)

    app.include_router(router)
