# Phase C: Governance Scaffolding

## Action Classes (A / B / C)

- **Type A (Log + Learn)**: Observations only. No execution path.
- **Type B (Draft + Single Approval)**: Requires one human approval. Evidence tier ≥ 2.
- **Type C (Full Evidence + Multi-Gate)**: Requires multi-gate approval. Evidence tier = 3.

## Approval States

- `log_only`: Logged, no action path.
- `drafted`: Prepared and waiting for review.
- `awaiting_single_approval`: Single approval required.
- `awaiting_multi_gate`: Multi-gate approval required.
- `approved`: Approved by human authority.
- `blocked`: Blocked due to insufficient confidence.
- `rejected`: Rejected by human authority.

## Evidence Tiers

- **tier_1**: Single-source or uncorroborated evidence. Suitable for logging only.
- **tier_2**: Multi-source evidence with partial verification.
- **tier_3**: Multi-source, verified evidence with traceable provenance.

## Confidence Rules (Non-Executing)

| Confidence | Outcome |
|-----------:|---------|
| 0-49 | Blocked |
| 50-89 | Approval required |
| 90-100 | Automation eligible (still blocked without approval) |

## Kernel Enforcement

- Action class gates are computed in `kernel/policies/actionClassPolicy.ts`.
- Evidence tier enforcement is validated in `kernel/policies/governancePolicy.ts`.
- Approval state updates are driven by explicit status transitions.
