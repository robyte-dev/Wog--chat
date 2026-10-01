 HEAD
** Fullstack Chat & Video Calling App **
![Demo App](/frontend/public/wog.png)
Highlights:
- Real-time Messaging with Typing Indicators & Reactions
- 1-on-1 and Group Video Calls with Screen Sharing & Recording
- JWT Authentication & Protected Routes
- Language Exchange Platform with 32 Unique UI Themes
- Tech Stack: React + Express + MongoDB + TailwindCSS + TanStack Query
- Global State Management with Zustand
- Error Handling (Frontend & Backend)
- Free Deployment
- Built with Scalable Technologies like Stream
- And much more!
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCUrfDqrYGVDAgAU2QtIq6DIzW7UHAMBfHGt1V+fXEwAAXrseHCQGBEuErVgAAAAASUVORK5CYII=)
** .env Setup**
**Backend (**/backend **)**
PORT=5001
 MONGO_URI=your_mongo_uri
 STREAM_API_KEY=your_stream_api_key
 STREAM_API_SECRET=your_stream_api_secret
 JWT_SECRET_KEY=your_jwt_secret
 NODE_ENV=development
 
**Frontend (**/frontend **)**
VITE_STREAM_API_KEY=your_stream_api_key
 
The frontend key must match the backend STREAM_API_KEY value for the same Stream project.
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4NIGBzPXBmAawhhW8ibAl2DIze3UGAMBf3Gu1VcfXEwAAXrsehaQEN+8fLHEAAAAASUVORK5CYII=)
** Run the Backend**
cd backend
 npm install
 npm run dev
 
** Run the Frontend**
cd frontend
 npm install
 npm run dev
 
**Wog--chat**
A MERN stack realtime chat app about language exchange worldwide/
*d2e1724a1b6bdcc6a6349cfd7b0351c79bbf1bc9*

## Local development

Start MongoDB separately (local MongoDB or MongoDB Atlas), then configure `backend/.env` with `MONGO_URI`, Stream credentials, Google client ID, and `JWT_SECRET_KEY`.

Run the backend and frontend in separate terminals:

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

The Notifications page shows friend requests and connection updates.

### Password reset email

The backend sends password reset codes through SMTP. For Gmail, enable 2-Step Verification and create an App Password, then put the SMTP settings in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`). Never use your normal Gmail password or commit `.env`. The six-digit reset code expires after five minutes; after password reset, the user must sign in again.

## Account security and active devices

WOG keeps a MongoDB `AuthSession` for each login and checks that record on protected API requests. Sessions expire after 30 days; activity time refreshes at most once every five minutes. A new browser/device receives no authenticated JWT until its email code is verified. Successful verification remembers that browser for 180 days using an HTTP-only device cookie. Signing a device out also removes its remembered-device record. Password reset clears all active sessions and remembered devices.

The first signup and a newly created Google account trust the current device because the user has just completed the initial account verification. Later logins from unknown devices use the configured SMTP sender. Existing JWT cookies created before session tracking was added are no longer accepted; sign in once to create a tracked session.

The Profile page includes **Devices and active sessions**, where users can revoke one device or all other devices. API access requires an active MongoDB session and valid signed JWT.

## Production health, logs, and recovery

- `GET /api/health/live` reports that the Node process is responding.
- `GET /api/health/ready` (also `/api/health`) reports readiness and MongoDB connectivity; it returns HTTP 503 if MongoDB is disconnected.
- Backend request logs are one JSON object per line with request ID, method, path, status, and duration. They omit cookies, message bodies, OTPs, and credentials. Keep the hosting platform's log retention enabled and use the `x-request-id` response header when reporting an issue.
- For MongoDB recovery, install MongoDB Database Tools and run a backup from the backend folder after loading `MONGO_URI` from your private environment file:

  ```bash
  set -a
  source .env
  set +a
  npm run backup:db
  ```

  The script creates a compressed archive in the project-level `backups/` directory with restrictive local permissions. That folder is ignored by Git. Copy the archive to encrypted storage separate from the app host; a backup left on the same computer is not disaster recovery.
- Before relying on a backup, restore it into a separate empty staging database and verify users, friends, and login. Example: `mongorestore --uri="$STAGING_MONGO_URI" --archive="/secure/path/wog-YYYYMMDDTHHMMSSZ.archive.gz" --gzip`. Use a staging URI and empty database. Do not add `--drop` against production without confirming the target and taking a fresh backup first.
- Schedule backups to match your acceptable data-loss window and rehearse restoration periodically. The script creates snapshots; it does not schedule, upload, encrypt at rest, or automatically prune remote copies.
