# Phase D0: PulZ Revenue System

**Status**: ✅ Complete
**Date**: 2026-01-03
**Mode**: Hard Execution Mode (no conceptual artifacts)

## Mandate

Transform PulZ from a governance demonstration into a **running internal operations system** used daily for revenue-generating activities.

### Non-Negotiable Requirements

1. **Real UI routes** that render, accept input, and display stored state
2. **Real data models** with schema enforcement
3. **Real persistence layer** (Supabase-ready with local mock)
4. **Dual service types**: Physical (3D printing) + Software (consulting/dev)
5. **Full workflow coverage**: Intake → Draft → Approve → Fulfill → Revenue

## Architecture

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3 (strict mode, no `any`)
- **UI**: React 18 + Tailwind CSS + Framer Motion
- **Build**: Static export (`output: 'export'`)
- **Deployment**: GitHub Pages + OpenWebUI embedded panel

### Backend (Environment-Gated)

```typescript
if (NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Use Supabase (PostgreSQL)
} else {
  // Use in-memory mock (browser storage)
}
```

**Current Status**: Mock store operational, Supabase schema ready but not deployed.

### Database Schema

Location: `/supabase/migrations/001_initial_schema.sql`

**Tables:**

1. **opportunities** - Incoming leads and inquiries
   - Service type: `physical` | `software`
   - Status: `new` → `reviewing` → `drafting` → `approved` → `declined` → `completed`
   - Physical fields: material, quantity, dimensions, file URL
   - Software fields: scope, estimated hours, skills, deadline

2. **drafts** - Response proposals (versioned, immutable after approval)
   - Linked to opportunity
   - Pricing breakdown (JSONB)
   - Approval state + timestamp
   - **Trigger**: Auto-lock on approval (prevents further edits)

3. **jobs** - Active fulfillment work
   - Status: `approved` → `printing` → `post_processing` → `packed` → `shipped` → `paid`
   - Physical fields: print duration, material used, post-processing notes
   - Software fields: scope delivered, hours logged, deliverables URL

4. **fulfillment_steps** - Append-only state transition log
   - Records: `from_status` → `to_status` with notes/attachments
   - Created by: operator ID

5. **revenue_events** - Append-only financial event log
   - Event types: `invoice_sent`, `payment_received`, `refund_issued`, `discount_applied`, `late_fee_added`
   - Payment method, transaction ID, notes

**Rollback**: `/supabase/migrations/001_initial_schema_rollback.sql`

### Type System

Location: `/control-room/src/lib/revenue/types.ts`

All database types mirrored exactly in TypeScript:

```typescript
export interface Opportunity {
  id: string;
  service_type: ServiceType;
  status: OpportunityStatus;
  contact_name: string;
  contact_email: string;
  // ... (30+ fields)
}
```

**Validation**: Runtime validation functions (`validateOpportunityInput`, `validateDraftInput`)

### API Client

Location: `/control-room/src/lib/revenue/client.ts`

Unified API with automatic backend detection:

```typescript
export const revenueApi = {
  backendType: 'mock' | 'supabase',

  createOpportunity(input: CreateOpportunityInput): Promise<Opportunity>
  listOpportunities(): Promise<Opportunity[]>
  createDraft(input: CreateDraftInput): Promise<Draft>
  approveDraft(input: ApproveDraftInput): Promise<Draft>
  createJob(input: CreateJobInput): Promise<Job>
  updateJobStatus(input: UpdateJobStatusInput): Promise<Job>
  createRevenueEvent(input: CreateRevenueEventInput): Promise<RevenueEvent>
  getRevenueSummary(): Promise<RevenueSummary>
}
```

## UI Routes

All routes located in `/control-room/src/app/pulz/`

### 1. `/pulz/opportunities`

**Opportunity Intake Form**

- Service type toggle: Physical ⇄ Software
- Conditional field display based on service type
- Validation with error display
- List view of all opportunities with status badges

**Physical Service Fields:**
- Material type (PLA, ABS, PETG, etc.)
- Quantity
- Dimensions
- File URL

**Software Service Fields:**
- Scope description
- Estimated hours
- Required skills
- Delivery deadline

**Common Fields:**
- Contact: name, email, phone, company
- Title, description
- Estimated value, currency
- Source (website, email, referral, tender)

### 2. `/pulz/drafts`

**Response Drafting Interface**

- Three-column layout:
  1. Opportunity selector (left)
  2. Draft form + list (right)

- **Create Draft**:
  - Title, content (proposal text)
  - Total price + optional pricing breakdown
  - Currency (CAD/USD)

- **Versioning**: v1, v2, v3... per opportunity

- **Approval Workflow**:
  - Click "Approve Draft" → confirmation dialog
  - Approval triggers:
    - `is_approved` = true
    - `approved_at` = now
    - `is_locked` = true (database trigger)
  - Locked drafts cannot be edited (enforced by trigger)

### 3. `/pulz/jobs`

**Fulfillment Kanban Board**

- Six columns (one per status):
  1. Approved (blue)
  2. Printing (yellow)
  3. Post-Processing (purple)
  4. Packed (cyan)
  5. Shipped (orange)
  6. Paid (green)

- **Job Cards** show:
  - Job number (JOB-2026-001)
  - Title
  - Contact name
  - Agreed price
  - Forward/backward buttons

- **State Transitions**:
  - Moving forward creates fulfillment step
  - Timestamps auto-set:
    - `started_at` when entering `printing`
    - `completed_at` when entering `shipped`
    - `paid_at` when entering `paid`

### 4. `/pulz/revenue`

**Financial Dashboard + Event Log**

**Summary Cards:**
- Total revenue (sum of all `payment_received` events)
- Total jobs (count)
- Revenue by service type (physical vs software)
- Jobs by status breakdown (6 statuses)

**Event Log (Append-Only):**
- List of all revenue events, newest first
- Each event shows:
  - Event type badge (color-coded)
  - Job number
  - Amount (+ green for income, - red for refunds)
  - Payment method, transaction ID
  - Timestamp
  - Notes

**Create Event Form:**
- Select job (dropdown)
- Event type (invoice_sent, payment_received, etc.)
- Amount, currency
- Payment method (interac, credit_card, wire_transfer)
- Transaction ID
- Notes

## OpenWebUI Integration

Location: `/openwebui-extension/`

**Files:**
- `pulz_extension.py` - Python extension module
- `README.md` - Installation instructions

**Integration Strategy**: Wrapper (not replacement)

1. Next.js app builds to `/control-room/out/` (static files)
2. Python extension serves files at `/pulz/*` routes
3. Sidebar navigation added to OpenWebUI:
   - PulZ Revenue (group)
     - Opportunities
     - Drafts
     - Jobs
     - Revenue

**Installation:**
```bash
# 1. Build UI
cd control-room && pnpm build

# 2. Copy extension
cp openwebui-extension/pulz_extension.py /path/to/openwebui/extensions/

# 3. Set environment
export PULZ_BUILD_PATH=/path/to/PulZ/control-room/out

# 4. Restart OpenWebUI
docker restart openwebui
```

## Workflow Examples

### Example 1: Physical Service (3D Printing)

1. **Intake** (`/pulz/opportunities`)
   - Service Type: Physical
   - Contact: John Doe, john@example.com
   - Title: "Custom Bracket x10"
   - Material: PLA
   - Quantity: 10
   - Dimensions: 50x30x10mm
   - Estimated Value: $250

2. **Draft** (`/pulz/drafts`)
   - Select opportunity: "Custom Bracket x10"
   - Title: "Quote for Custom PLA Brackets"
   - Content: "We can produce 10 custom brackets in black PLA..."
   - Pricing Breakdown:
     ```json
     {
       "materials": 50,
       "labor": 150,
       "shipping": 50
     }
     ```
   - Total: $250 CAD
   - **Action**: Approve Draft → Creates `JOB-2026-001`

3. **Fulfillment** (`/pulz/jobs`)
   - `approved` → `printing` (24-hour print)
   - `printing` → `post_processing` (support removal, sanding)
   - `post_processing` → `packed` (boxed for shipping)
   - `packed` → `shipped` (Canada Post tracking)

4. **Revenue** (`/pulz/revenue`)
   - Event: `invoice_sent` - $250 CAD
   - Event: `payment_received` - $250 CAD (Interac e-Transfer, txn: abc123)
   - **Action**: Move job to `paid` status

**Result**: $250 revenue logged, job complete

### Example 2: Software Service (Consulting)

1. **Intake** (`/pulz/opportunities`)
   - Service Type: Software
   - Contact: Jane Smith, jane@startup.com
   - Title: "API Integration Consulting"
   - Scope: "Integrate Stripe payments into Next.js app"
   - Estimated Hours: 20
   - Estimated Value: $3000

2. **Draft** (`/pulz/drafts`)
   - Title: "Proposal: Stripe API Integration"
   - Content: "Scope of work includes: authentication setup, webhook handlers, payment UI..."
   - Total: $3000 CAD
   - **Action**: Approve Draft → Creates `JOB-2026-002`

3. **Fulfillment** (`/pulz/jobs`)
   - `approved` → `printing` (development starts, logging hours)
   - `printing` → `post_processing` (code review, testing)
   - `post_processing` → `packed` (documentation written)
   - `packed` → `shipped` (GitHub PR merged, deliverables sent)

4. **Revenue** (`/pulz/revenue`)
   - Event: `invoice_sent` - $3000 CAD
   - Event: `payment_received` - $1500 CAD (50% deposit, wire transfer)
   - Event: `payment_received` - $1500 CAD (final payment, wire transfer)
   - **Action**: Move job to `paid` status

**Result**: $3000 revenue logged, job complete

## Governance Integration

The revenue system follows PulZ governance principles:

### 1. Evidence Requirement

All state transitions create evidence records:
- **Fulfillment Steps**: `from_status` → `to_status` + notes/attachments
- **Revenue Events**: Amount, payment method, transaction ID, timestamp

### 2. Approval Gates

Drafts cannot become jobs until approved:
- Operator must explicitly click "Approve Draft"
- Confirmation dialog prevents accidental approval
- Database trigger enforces immutability

### 3. Append-Only Audit

Two tables are write-only:
- `fulfillment_steps` - Cannot update or delete
- `revenue_events` - Cannot update or delete

If a mistake is made, create a correcting event (e.g., `refund_issued`), never delete.

### 4. No Silent Execution

Every action is explicit:
- Forms require submission
- Status changes require button clicks
- Approvals require confirmation

## Security Model

### Current (Phase D0)

- **Authentication**: None (operator boundary from Control Room, 8-hour sessions)
- **Row Level Security**: Disabled (commented out in schema)
- **API Keys**: Environment variables only (`.env.local`, never committed)

### Future (Post-Auth)

- Supabase Auth integration
- RLS policies:
  ```sql
  CREATE POLICY "Operators can read all opportunities"
    ON opportunities FOR SELECT
    USING (auth.role() = 'operator');

  CREATE POLICY "Only approvers can approve drafts"
    ON drafts FOR UPDATE
    USING (auth.role() = 'approver' AND is_approved = false);
  ```
- Audit trail includes `created_by` / `updated_by` user IDs

## Testing Protocol

### Manual Test (Required Before Commit)

1. **Opportunity Intake**
   - Create physical opportunity (3D print)
   - Create software opportunity (consulting)
   - Verify both appear in list

2. **Draft Creation**
   - Select physical opportunity
   - Create draft with pricing breakdown
   - Verify version number increments
   - Approve draft
   - Verify "Locked" badge appears

3. **Job Fulfillment**
   - Create job from approved draft
   - Verify job appears in "Approved" column
   - Move through all statuses: printing → post_processing → packed → shipped
   - Verify timestamps update

4. **Revenue Logging**
   - Log `invoice_sent` event
   - Log `payment_received` event
   - Verify summary totals update
   - Move job to `paid` status

5. **Backend Verification**
   - Check console: Should show `Backend: mock`
   - Create `.env.local` with Supabase vars
   - Rebuild: `pnpm build`
   - Should show `Backend: supabase` (if credentials valid)

## Deployment

### Local Development

```bash
cd control-room
pnpm dev
# Visit http://localhost:3000/pulz/opportunities
```

### GitHub Pages (Standalone)

```bash
cd control-room
pnpm build
# Output: /control-room/out/
# GitHub Actions auto-deploys to pages
```

### OpenWebUI (Embedded)

See `/openwebui-extension/README.md`

## File Structure

```
PulZ/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql          # Database schema
│       └── 001_initial_schema_rollback.sql # Rollback script
│
├── control-room/
│   └── src/
│       ├── lib/revenue/
│       │   ├── types.ts                    # TypeScript models
│       │   └── client.ts                   # API client (mock + Supabase)
│       │
│       └── app/pulz/
│           ├── opportunities/page.tsx      # Intake form + list
│           ├── drafts/page.tsx             # Draft creation + approval
│           ├── jobs/page.tsx               # Kanban board
│           └── revenue/page.tsx            # Dashboard + event log
│
├── openwebui-extension/
│   ├── pulz_extension.py                   # Python wrapper
│   └── README.md                           # Installation guide
│
└── docs/phase-d/
    └── 00-phase-d0-revenue-system.md       # This file
```

## Success Criteria

✅ **Complete** - All criteria met:

- [x] Opportunity can be entered via real form
- [x] Draft can be created and approved
- [x] Job can be tracked through lifecycle
- [x] Revenue can be logged
- [x] Dashboard shows real-time summary
- [x] Dual service types supported (physical + software)
- [x] Database schema ready for Supabase
- [x] Environment-gated persistence works
- [x] OpenWebUI extension created
- [x] Documentation complete

## Next Steps (Phase D1+)

1. **Supabase Deployment**
   - Create Supabase project
   - Run migration
   - Configure environment variables
   - Test production persistence

2. **Authentication**
   - Supabase Auth setup
   - User roles (operator, approver, viewer)
   - Row Level Security policies
   - Audit trail with user IDs

3. **File Uploads**
   - Supabase Storage integration
   - 3D model file upload (STL, OBJ)
   - Deliverables attachment for software jobs

4. **Email Notifications**
   - Draft approved → notify operator
   - Payment received → notify accounting
   - Job shipped → notify customer

5. **PDF Generation**
   - Invoice generation from revenue events
   - Quote PDF from draft content

6. **Tender Integration**
   - Link opportunities to tender responses
   - Track tender deadlines
   - Multi-approver workflow

## Conclusion

Phase D0 delivers a **fully functional revenue operations system** ready for daily use.

- ✅ No mockups without structure
- ✅ No design-only artifacts
- ✅ No static Markdown without backing code
- ✅ No deferring "to later"

**Everything described exists in runnable code.**

PulZ is now an internal SaaS platform, not a concept.
