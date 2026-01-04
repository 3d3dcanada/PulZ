# PulZ Opportunity Engine Runbook (V1)

## Start the stack

```bash
cd /workspace/PulZ
# Build the UI export
cd control-room
pnpm install
pnpm build
cd ..

# Start OpenWebUI with the PulZ mount + API patch
# (Docker Compose file assumes OpenWebUI image and PulZ volumes.)
docker compose up -d
```

## Run a 6-hour mission

```bash
curl -X POST http://localhost:3000/api/pulz/mission/start \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes":360,"sources":["reddit_smallbusiness","rss_forhire"],"rate_per_source_per_minute":1,"max_items":200}'
```

## View live feed

Open the UI:

```
http://localhost:3000/pulz/
```

Or stream the feed directly:

```bash
curl -N http://localhost:3000/api/pulz/feed
```

## Data storage

PulZ stores mission state and artifacts in:

```
/app/backend/data/pulz/pulz.sqlite3
```

Override with:

```
PULZ_DATA_DIR=/app/backend/data/pulz
```

## Enable auth safely

If you set:

```
WEBUI_AUTH=true
```

All `/api/pulz/*` routes require a verified OpenWebUI user via existing auth middleware. The `/pulz` UI will surface a “Login required” banner if the API returns 401.

## Verification commands

```bash
# config endpoint
curl -sSf http://localhost:3000/api/config > /dev/null

# pulz status
curl -sSf http://localhost:3000/api/pulz/status

# start mission and watch SSE
curl -X POST http://localhost:3000/api/pulz/mission/start \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes":15,"sources":["reddit_smallbusiness"],"rate_per_source_per_minute":1,"max_items":20}'

curl -N http://localhost:3000/api/pulz/feed
```
