import json
import os
import sys
import tempfile
import unittest
import uuid
from importlib import reload
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient


def setup_app(tmpdir: str):
    os.environ["PULZ_DATA_DIR"] = tmpdir
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    import pulz_backend

    reload(pulz_backend)
    app = FastAPI()
    pulz_backend.register(app)
    return TestClient(app), pulz_backend


def seed_proposal(pulz_backend, status: str, execution_mode: str):
    proposal_id = uuid.uuid4().hex
    signal_id = uuid.uuid4().hex
    proposal = {
        "problem_summary": "Need a template",
        "message_template": "Draft response",
        "solution_options": ["Option A"],
    }
    with pulz_backend._get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO signals (id, source, url, title, body_excerpt, author, created_at, raw_json, scored_json, proposal_id, status, inserted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                signal_id,
                "reddit:smallbusiness",
                "https://example.com",
                "Test signal",
                "Need a template",
                "author",
                pulz_backend._now_iso(),
                json.dumps({}),
                json.dumps({}),
                proposal_id,
                "queued",
                pulz_backend._now_iso(),
            ),
        )
        conn.execute(
            """
            INSERT INTO proposals (id, signal_id, status, created_at, updated_at, data_json, execution_mode, mission_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                proposal_id,
                signal_id,
                status,
                pulz_backend._now_iso(),
                pulz_backend._now_iso(),
                json.dumps(proposal),
                execution_mode,
                "mission-test",
            ),
        )
    return proposal_id


class PulzExecutionTests(unittest.TestCase):
    def test_approval_auto_enqueue(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            client, pulz_backend = setup_app(tmpdir)
            proposal_id = seed_proposal(pulz_backend, "queued", "auto_after_approval")

            response = client.post(f"/api/pulz/queue/{proposal_id}/approve")
            self.assertEqual(response.status_code, 200)

            with pulz_backend._get_db_connection() as conn:
                row = conn.execute(
                    "SELECT id, status FROM executions WHERE proposal_id = ?",
                    (proposal_id,),
                ).fetchone()
            self.assertIsNotNone(row)
            self.assertIn(row["status"], {"queued", "running", "succeeded"})

    def test_manual_execute_creates_execution(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            client, pulz_backend = setup_app(tmpdir)
            proposal_id = seed_proposal(pulz_backend, "approved", "manual")

            response = client.post(
                f"/api/pulz/proposals/{proposal_id}/execute",
                json={"lane": "html"},
            )
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertIn("execution_id", payload)

            with pulz_backend._get_db_connection() as conn:
                row = conn.execute(
                    "SELECT status FROM executions WHERE id = ?",
                    (payload["execution_id"],),
                ).fetchone()
            self.assertIsNotNone(row)

    def test_cancel_execution_emits_telemetry(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            client, pulz_backend = setup_app(tmpdir)
            proposal_id = seed_proposal(pulz_backend, "approved", "manual")

            response = client.post(
                f"/api/pulz/proposals/{proposal_id}/execute",
                json={"lane": "html"},
            )
            execution_id = response.json()["execution_id"]

            cancel_response = client.post(f"/api/pulz/executions/{execution_id}/cancel")
            self.assertEqual(cancel_response.status_code, 200)

            with pulz_backend._get_db_connection() as conn:
                telemetry_row = conn.execute(
                    """
                    SELECT type FROM telemetry_events
                    WHERE execution_id = ? AND type = 'execution_cancelled'
                    """,
                    (execution_id,),
                ).fetchone()
            self.assertIsNotNone(telemetry_row)


if __name__ == "__main__":
    unittest.main()
