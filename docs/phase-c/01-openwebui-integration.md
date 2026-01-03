# Phase C: OpenWebUI Integration Plan

## Integration stance

PulZ runs as a governed control layer on top of OpenWebUI. We treat OpenWebUI as the operator surface and inject a PulZ control room shell (governance panels, decision frames, routing visibility).

## Integration path (current)

- **Wrapper approach**: PulZ Control Room remains a standalone Next.js UI embedded as a module/panel within OpenWebUI.
- **No automation**: Any action remains a proposal. Execution is blocked until explicit approval artifacts are recorded.

## Immediate wiring targets

1. **Control Room Panel** inside OpenWebUI navigation.
2. **Governance drawer** containing action classes, approval state, and confidence gates.
3. **Model routing surface** showing which lane is selected and why.
4. **Audit preview** showing immutable log snippets.

## Assumptions (safe defaults)

- OpenWebUI is treated as a host shell; PulZ does not alter its agent execution behavior.
- PulZ components are isolated; no outbound messaging or scraping is enabled.
