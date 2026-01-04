import asyncio
import hashlib
import os
import textwrap
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, List, Protocol
from zipfile import ZipFile


class Executor(Protocol):
    lane: str

    def plan(self, proposal: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        ...

    async def run(
        self,
        execution_id: str,
        proposal: Dict[str, Any],
        context: Dict[str, Any],
        emit: Callable[[str, str, Dict[str, Any]], Awaitable[None]],
    ) -> "ExecutorOutcome":
        ...


@dataclass
class ExecutorOutcome:
    outputs: Dict[str, Any]
    artifacts: List[Dict[str, Any]]
    metrics: Dict[str, Any]


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _hash_file(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _proposal_text(proposal: Dict[str, Any]) -> str:
    summary = proposal.get("problem_summary", "Opportunity summary")
    message = proposal.get("message_template", "")
    solutions = proposal.get("solution_options") or []
    lines = [
        f"Summary: {summary}",
        "",
        "Proposed response:",
        message,
        "",
        "Solution options:",
        *[f"- {option}" for option in solutions],
    ]
    return "\n".join(lines).strip()


def _simple_pdf_bytes(text: str) -> bytes:
    lines = textwrap.wrap(text, 80)
    content_lines = []
    y = 770
    for line in lines:
        content_lines.append(f"1 0 0 1 50 {y} Tm ({line}) Tj")
        y -= 14
        if y < 50:
            break
    content_stream = "\n".join(content_lines)
    content = (
        "BT\n/F1 12 Tf\n"
        f"{content_stream}\n"
        "ET"
    )
    objects = []
    objects.append("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj")
    objects.append("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj")
    objects.append(
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj"
    )
    objects.append(
        f"4 0 obj << /Length {len(content)} >> stream\n{content}\nendstream endobj"
    )
    objects.append("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj")
    xref_positions = []
    pdf = "%PDF-1.4\n"
    for obj in objects:
        xref_positions.append(len(pdf))
        pdf += f"{obj}\n"
    xref_start = len(pdf)
    pdf += "xref\n0 6\n0000000000 65535 f \n"
    for pos in xref_positions:
        pdf += f"{pos:010} 00000 n \n"
    pdf += (
        "trailer << /Size 6 /Root 1 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF"
    )
    return pdf.encode("latin-1")


def _check_cancel(context: Dict[str, Any]) -> None:
    cancel_event = context.get("cancel_event")
    if cancel_event and cancel_event.is_set():
        raise asyncio.CancelledError()


class HtmlExecutor:
    lane = "html"

    def plan(self, proposal: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        text = _proposal_text(proposal)
        return {
            "estimated_tokens": max(1, int(len(text) / 4)),
            "estimated_seconds": 2,
        }

    async def run(
        self,
        execution_id: str,
        proposal: Dict[str, Any],
        context: Dict[str, Any],
        emit: Callable[[str, str, Dict[str, Any]], Awaitable[None]],
    ) -> ExecutorOutcome:
        _check_cancel(context)
        await emit("execution_log", "running", {"message": "Generating HTML layout"})
        output_root = os.path.join(context["output_dir"], execution_id, "html")
        _ensure_dir(output_root)
        html_path = os.path.join(output_root, "index.html")
        css_path = os.path.join(output_root, "styles.css")
        summary = proposal.get("problem_summary", "Opportunity")
        solutions = proposal.get("solution_options") or []
        message = proposal.get("message_template", "")
        html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{summary}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="container">
      <h1>{summary}</h1>
      <section>
        <h2>Proposal</h2>
        <p>{message.replace(chr(10), '<br/>')}</p>
      </section>
      <section>
        <h2>Solution options</h2>
        <ul>
          {''.join([f'<li>{option}</li>' for option in solutions])}
        </ul>
      </section>
    </main>
  </body>
</html>
"""
        css = """
body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
.container { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
h1, h2 { color: #38bdf8; }
section { margin-top: 24px; padding: 16px; background: #111827; border-radius: 12px; }
"""
        with open(html_path, "w", encoding="utf-8") as handle:
            handle.write(html)
        with open(css_path, "w", encoding="utf-8") as handle:
            handle.write(css)
        _check_cancel(context)
        await emit("execution_progress", "running", {"message": "HTML generated"})
        artifacts = [
            {"kind": "html", "path": html_path, "sha256": _hash_file(html_path)},
            {"kind": "html", "path": css_path, "sha256": _hash_file(css_path)},
        ]
        return ExecutorOutcome(
            outputs={"html_path": html_path, "css_path": css_path},
            artifacts=artifacts,
            metrics={"artifact_count": len(artifacts)},
        )


class PdfExecutor:
    lane = "pdf"

    def plan(self, proposal: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        text = _proposal_text(proposal)
        return {"estimated_tokens": max(1, int(len(text) / 4)), "estimated_seconds": 2}

    async def run(
        self,
        execution_id: str,
        proposal: Dict[str, Any],
        context: Dict[str, Any],
        emit: Callable[[str, str, Dict[str, Any]], Awaitable[None]],
    ) -> ExecutorOutcome:
        _check_cancel(context)
        await emit("execution_log", "running", {"message": "Generating PDF"})
        output_root = os.path.join(context["output_dir"], execution_id, "pdf")
        _ensure_dir(output_root)
        pdf_path = os.path.join(output_root, "proposal.pdf")
        pdf_bytes = _simple_pdf_bytes(_proposal_text(proposal))
        with open(pdf_path, "wb") as handle:
            handle.write(pdf_bytes)
        _check_cancel(context)
        await emit("execution_progress", "running", {"message": "PDF generated"})
        artifacts = [{"kind": "pdf", "path": pdf_path, "sha256": _hash_file(pdf_path)}]
        return ExecutorOutcome(
            outputs={"pdf_path": pdf_path},
            artifacts=artifacts,
            metrics={"artifact_count": len(artifacts)},
        )


class DocExecutor:
    lane = "doc"

    def plan(self, proposal: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        text = _proposal_text(proposal)
        return {"estimated_tokens": max(1, int(len(text) / 4)), "estimated_seconds": 3}

    async def run(
        self,
        execution_id: str,
        proposal: Dict[str, Any],
        context: Dict[str, Any],
        emit: Callable[[str, str, Dict[str, Any]], Awaitable[None]],
    ) -> ExecutorOutcome:
        _check_cancel(context)
        await emit("execution_log", "running", {"message": "Generating markdown + PDF document"})
        output_root = os.path.join(context["output_dir"], execution_id, "doc")
        _ensure_dir(output_root)
        md_path = os.path.join(output_root, "document.md")
        pdf_path = os.path.join(output_root, "document.pdf")
        text = _proposal_text(proposal)
        with open(md_path, "w", encoding="utf-8") as handle:
            handle.write(f"# Proposal Document\n\n{text}\n")
        with open(pdf_path, "wb") as handle:
            handle.write(_simple_pdf_bytes(text))
        _check_cancel(context)
        await emit("execution_progress", "running", {"message": "Document artifacts generated"})
        artifacts = [
            {"kind": "doc", "path": md_path, "sha256": _hash_file(md_path)},
            {"kind": "pdf", "path": pdf_path, "sha256": _hash_file(pdf_path)},
        ]
        return ExecutorOutcome(
            outputs={"md_path": md_path, "pdf_path": pdf_path},
            artifacts=artifacts,
            metrics={"artifact_count": len(artifacts)},
        )


class SiteExecutor:
    lane = "site"

    def plan(self, proposal: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        text = _proposal_text(proposal)
        return {"estimated_tokens": max(1, int(len(text) / 4)), "estimated_seconds": 5}

    async def run(
        self,
        execution_id: str,
        proposal: Dict[str, Any],
        context: Dict[str, Any],
        emit: Callable[[str, str, Dict[str, Any]], Awaitable[None]],
    ) -> ExecutorOutcome:
        _check_cancel(context)
        await emit("execution_log", "running", {"message": "Building static site"})
        output_root = os.path.join(context["output_dir"], execution_id, "site")
        _ensure_dir(output_root)
        pages = {
            "index.html": "Home",
            "about.html": "About",
            "contact.html": "Contact",
        }
        summary = proposal.get("problem_summary", "Opportunity")
        message = proposal.get("message_template", "")
        for filename, title in pages.items():
            page_path = os.path.join(output_root, filename)
            with open(page_path, "w", encoding="utf-8") as handle:
                handle.write(
                    f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} - {summary}</title>
  </head>
  <body>
    <main>
      <h1>{title}</h1>
      <p>{summary}</p>
      <p>{message.replace(chr(10), '<br/>')}</p>
    </main>
  </body>
</html>
"""
                )
            _check_cancel(context)
        zip_path = os.path.join(context["output_dir"], execution_id, "site.zip")
        with ZipFile(zip_path, "w") as archive:
            for filename in pages.keys():
                archive.write(os.path.join(output_root, filename), arcname=filename)
        _check_cancel(context)
        await emit("execution_progress", "running", {"message": "Static site bundle ready"})
        artifacts = [
            {"kind": "html", "path": os.path.join(output_root, "index.html"), "sha256": _hash_file(os.path.join(output_root, "index.html"))},
            {"kind": "zip", "path": zip_path, "sha256": _hash_file(zip_path)},
        ]
        return ExecutorOutcome(
            outputs={"site_dir": output_root, "zip_path": zip_path},
            artifacts=artifacts,
            metrics={"artifact_count": len(artifacts)},
        )


EXECUTORS = {
    "html": HtmlExecutor(),
    "pdf": PdfExecutor(),
    "doc": DocExecutor(),
    "site": SiteExecutor(),
}
