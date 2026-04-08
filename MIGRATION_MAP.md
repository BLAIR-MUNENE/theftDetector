# Migration Map (Legacy -> Recreated Stack)

This file maps current `backend.py` and `dashboard/` capabilities into the recreated stack:

- Backend target: `backend/` (Django + Django Ninja Extra)
- Frontend target: `frontend/theftdetectorui/` (Next.js)
- Legacy stack remains untouched: `backend.py` + `dashboard/`

## Backend Domain Mapping

- `backend.py` health/settings/roi/stats -> `backend/core/api.py`
- `backend.py` history alerts -> `backend/alerts/api.py`
- `backend.py` face routes -> `backend/faces/api.py`
- `backend.py` camera routes -> `backend/cameras/api.py`
- `backend.py` training routes -> `backend/training/api.py`
- New auth/signup/login/logout/me -> `backend/users/api.py`
- WebSocket route `/ws` -> `backend/streaming/ws.py` + `backend/theftdetectorbackend/asgi.py`

## Frontend Mapping

- Legacy app shell/navigation -> `frontend/theftdetectorui/components/AppShell.tsx`
- Auth pages -> `frontend/theftdetectorui/app/login/page.tsx`, `frontend/theftdetectorui/app/signup/page.tsx`
- Protected route logic -> `frontend/theftdetectorui/middleware.ts`
- Route recreations:
  - `/` -> `frontend/theftdetectorui/app/page.tsx`
  - `/live` -> `frontend/theftdetectorui/app/live/page.tsx`
  - `/cameras` -> `frontend/theftdetectorui/app/cameras/page.tsx`
  - `/history` -> `frontend/theftdetectorui/app/history/page.tsx`
  - `/faces` -> `frontend/theftdetectorui/app/faces/page.tsx`
  - `/settings` -> `frontend/theftdetectorui/app/settings/page.tsx`
  - `/roi`, `/train`, `/playback` -> scaffolded pages ready for deeper UI parity

## Compatibility Strategy

- Route compatibility: recreated backend uses root-compatible routes (`/settings`, `/faces`, etc.) and also mounts under `/api/v1/`.
- Data compatibility: recreated backend reads legacy runtime files where available:
  - `settings.json` / `settings.example.json`
  - `theft_detection.db` tables (`alerts`, `faces`, `training_*`) where present
- Non-interference:
  - legacy runtime remains independent
  - recreated runtime uses separate process/port
