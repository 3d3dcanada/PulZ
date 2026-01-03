# PulZ OpenWebUI Extension

**Phase D0 Hard Execution Mode**

This extension integrates the PulZ revenue system into OpenWebUI as a navigation panel.

## Features

- **Opportunity Intake**: Capture leads for physical (3D printing) and software (consulting/dev) services
- **Response Drafting**: Generate proposals with approval workflow and immutable audit trail
- **Fulfillment Tracking**: Kanban-style job tracking through lifecycle states
- **Revenue Logging**: Append-only revenue events for accounting compliance
- **Financial Dashboard**: Real-time summary of revenue by service type and job status

## Installation

### 1. Build PulZ UI

```bash
cd control-room
pnpm install
pnpm build
```

This generates static files in `/control-room/out/`.

### 2. Install Extension in OpenWebUI

Copy the extension file to your OpenWebUI extensions directory:

```bash
cp openwebui-extension/pulz_extension.py /path/to/openwebui/extensions/
```

### 3. Configure Environment

Set the build path environment variable:

```bash
export PULZ_BUILD_PATH=/path/to/PulZ/control-room/out
```

Or add to your OpenWebUI `.env` file:

```
PULZ_BUILD_PATH=/path/to/PulZ/control-room/out
```

### 4. Restart OpenWebUI

```bash
# Docker
docker restart openwebui

# Direct install
systemctl restart openwebui
```

## Usage

After installation, you'll see **PulZ Revenue** in the OpenWebUI sidebar with four sections:

### 1. Opportunities (`/pulz/opportunities`)

Intake form for new leads:

- **Physical Services**: Material type, quantity, dimensions, file upload
- **Software Services**: Scope description, estimated hours, delivery deadline

Fields:
- Contact information (name, email, phone, company)
- Opportunity details (title, description)
- Financial estimate and source tracking

### 2. Drafts (`/pulz/drafts`)

Create response drafts for opportunities:

- Select an opportunity
- Write proposal content
- Set pricing (total + optional breakdown)
- **Approve draft** (immutable after approval)

Version-controlled: Each opportunity can have multiple draft versions.

### 3. Jobs (`/pulz/jobs`)

Kanban board for job fulfillment:

**States:**
1. `approved` - Draft approved, job created
2. `printing` - Physical: actively printing | Software: development started
3. `post_processing` - Physical: support removal, finishing | Software: code review, testing
4. `packed` - Physical: packaged for shipment | Software: deliverables prepared
5. `shipped` - Physical: shipped to client | Software: delivered to client
6. `paid` - Payment received

Drag jobs between states or use action buttons.

### 4. Revenue (`/pulz/revenue`)

Financial tracking and reporting:

**Dashboard:**
- Total revenue
- Total jobs
- Revenue by service type (physical vs software)
- Jobs by status breakdown

**Event Log (Append-Only):**
- `invoice_sent`
- `payment_received`
- `refund_issued`
- `discount_applied`
- `late_fee_added`

Each event includes amount, payment method, transaction ID, and notes.

## Backend Configuration

The extension supports **environment-gated persistence**:

### Mock Backend (Default)

No configuration needed. Data stored in browser memory (resets on reload).

### Supabase Backend (Production)

Set environment variables in `/control-room/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then run the database migration:

```bash
# Using Supabase CLI
supabase db push --file supabase/migrations/001_initial_schema.sql

# Or via Supabase dashboard
# Paste contents of 001_initial_schema.sql into SQL editor
```

Rebuild the UI after configuration:

```bash
cd control-room
pnpm build
```

## Database Schema

Tables (see `supabase/migrations/001_initial_schema.sql`):

- `opportunities` - Incoming leads and inquiries
- `drafts` - Response proposals (immutable after approval)
- `jobs` - Active fulfillment work
- `fulfillment_steps` - Append-only state transition log
- `revenue_events` - Append-only financial event log

**Rollback:** Use `001_initial_schema_rollback.sql` if needed.

## Workflow Example

### Physical Service (3D Printing)

1. **Intake**: Customer requests 10 PLA parts via website form
2. **Draft**: Create quote for $250 CAD (materials: $50, labor: $150, shipping: $50)
3. **Approve**: Lock draft and create job `JOB-2026-001`
4. **Fulfill**:
   - `approved` → `printing` (24 hour print)
   - `printing` → `post_processing` (support removal)
   - `post_processing` → `packed`
   - `packed` → `shipped`
5. **Revenue**:
   - Log event: `invoice_sent` ($250)
   - Log event: `payment_received` ($250, via Interac)
6. **Complete**: Job status → `paid`

### Software Service (Consulting)

1. **Intake**: Client requests 20-hour consulting engagement
2. **Draft**: Create proposal for $3000 CAD scope of work
3. **Approve**: Lock draft and create job `JOB-2026-002`
4. **Fulfill**:
   - `approved` → `printing` (development starts)
   - `printing` → `post_processing` (code review, testing)
   - `post_processing` → `packed` (documentation ready)
   - `packed` → `shipped` (deliverables sent)
5. **Revenue**:
   - Log event: `invoice_sent` ($3000)
   - Log event: `payment_received` ($1500, deposit)
   - Log event: `payment_received` ($1500, final)
6. **Complete**: Job status → `paid`

## Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Build**: Static export (`next build`)

### Backend (Environment-Gated)
- **Mock**: In-memory store (browser sessionStorage)
- **Production**: Supabase (PostgreSQL with Row Level Security)

### Type Safety
All models defined in `/control-room/src/lib/revenue/types.ts`:
- Runtime validation for forms
- Database schema mirrored exactly
- Compile-time type checking

## Development

Run locally without OpenWebUI:

```bash
cd control-room
pnpm dev
```

Visit `http://localhost:3000/pulz/opportunities`

## Troubleshooting

### Extension not appearing in sidebar

1. Check build exists: `ls control-room/out/index.html`
2. Check environment variable: `echo $PULZ_BUILD_PATH`
3. Check OpenWebUI logs for PulZ initialization messages

### "Backend: mock" showing instead of "Backend: supabase"

1. Verify environment variables are set in `.env.local`
2. Rebuild UI: `cd control-room && pnpm build`
3. Restart OpenWebUI

### Database errors

1. Verify Supabase credentials
2. Check migration was applied: `supabase db diff`
3. Check Row Level Security policies (RLS disabled for now)

## Security Notes

- **RLS Placeholder**: Row Level Security commented out in schema (auth not configured)
- **Draft Immutability**: Enforced at database level (trigger prevents updates to locked drafts)
- **Append-Only Logs**: `fulfillment_steps` and `revenue_events` are write-only (no updates/deletes)
- **No Secrets in Code**: All credentials in environment variables, never committed

## Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] Role-based access control (operator vs viewer)
- [ ] Email notifications (draft approved, payment received)
- [ ] File upload for 3D models (Supabase Storage)
- [ ] Invoice generation (PDF export)
- [ ] Tender tracking integration
- [ ] Stripe/Interac payment links

## License

Proprietary - 3d3dcanada

## Support

Issues: https://github.com/3d3dcanada/PulZ/issues
