import pathlib

MARKER_START = "# --- PULZ_PATCH_START"
MARKER_END = "# --- PULZ_PATCH_END"

PATCH_BLOCK = f"""
{MARKER_START}
try:
    import importlib.util
    import sys
    import logging

    _pulz_spec = importlib.util.spec_from_file_location("pulz_backend", "/app/pulz_backend.py")
    if _pulz_spec and _pulz_spec.loader:
        _pulz_module = importlib.util.module_from_spec(_pulz_spec)
        sys.modules["pulz_backend"] = _pulz_module
        _pulz_spec.loader.exec_module(_pulz_module)
        if hasattr(_pulz_module, "register"):
            _pulz_module.register(app)
except Exception as exc:
    logging.getLogger("pulz").exception("PulZ patch failed: %s", exc)
{MARKER_END}
"""


def apply_patch(main_path: pathlib.Path) -> None:
    content = main_path.read_text()
    if MARKER_START in content:
        return

    insert_after = "app = FastAPI"
    lines = content.splitlines()
    new_lines = []
    inserted = False
    for line in lines:
        new_lines.append(line)
        if not inserted and insert_after in line:
            new_lines.append(PATCH_BLOCK)
            inserted = True
    if not inserted:
        new_lines.append(PATCH_BLOCK)
    main_path.write_text("\n".join(new_lines))


if __name__ == "__main__":
    main_file = pathlib.Path("/app/backend/open_webui/main.py")
    if main_file.exists():
        apply_patch(main_file)
