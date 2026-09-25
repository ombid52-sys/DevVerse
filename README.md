# DevVerse — Cloud Application Showcase & Source-Code Platform

DevVerse is a cloud-native platform that enables developers to showcase desktop, mobile, and web applications alongside complete, interactive source-code repositories. Built with Next.js, React, TypeScript, Tailwind CSS, MongoDB, and the Google Drive API.

---

## Table of Contents

- [Overview & Capabilities](#overview--capabilities)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Account Roles & Governance](#account-roles--governance)
- [Security & Archive Protection](#security--archive-protection)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Google Cloud & Google Drive Setup](#google-cloud--google-drive-setup)
- [Installation & Local Setup](#installation--local-setup)
- [Running Automated Tests](#running-automated-tests)
- [Admin Initialization](#admin-initialization)
- [Building & Running in Production](#building--running-in-production)
- [Deploying to Render](#deploying-to-render)
- [API Reference](#api-reference)

---

## Overview & Capabilities

- **Multi-Platform Showcase**: Supports Windows (`.exe`), Linux (`AppImage`/binaries), macOS (`.dmg`/`.app`), Android (`.apk`), and Web Applications.
- **Persistent Cloud Source Storage**: Source code projects are uploaded as ZIP archives, inspected for safety, and stored persistently in Google Drive (`GOOGLE_DRIVE_ROOT_FOLDER_ID`) with server-side access control.
- **GitHub-Inspired Repository Browser**: Collapsible folder tree, interactive breadcrumbs, syntax-highlighted code viewer with line numbers, file metadata, and ZIP download.
- **Automated Language Detection**: Analyzes source code and computes byte distributions and percentages (e.g. `TypeScript 54%`, `Python 27%`), automatically ignoring noise directories (`node_modules`, `.git`, `dist`, minified files, and lockfiles).
- **Curated Collections & Favourites**: Users can star public applications and curate custom collections.
- **Administrative Control Center**: Exactly one administrator account. Manage account states (`ACTIVE`, `DISABLED` with expiration, `SUSPENDED`), inspect applications, toggle visibility, and monitor real-time security events.
- **Near-Real-Time Audit Stream**: Server-Sent Events (SSE) feed broadcasting user and system audit logs in real time.

---

## Architecture & Tech Stack

```text
Browser Client (React 19 + Tailwind CSS)
    ↓
Next.js App Router (Server Components & Route Handlers)
    ↓
Authentication & Authorization (jose JWT in HTTP-only SameSite cookies, bcrypt)
    ↓
Business Services (Source Inspection, Language Detection, Email, Audit)
    ↓
MongoDB (Metadata source of truth) + Google Drive (Persistent source code artifacts)
```

- **Frontend / Framework**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS (Google-inspired utilitarian minimalism design language)
- **Database**: MongoDB (indexes on emails, usernames, slugs, categories, platforms, favorites)
- **Storage**: Google Drive API (`googleapis`) with local filesystem fallback for non-GCP development
- **Security**: Zod schema validation, bcryptjs password hashing (12 rounds), sliding-window rate limiting, ZipSlip / path-traversal prevention, decompression bomb protection

---

## Account Roles & Governance

1. **User**:
   - Register and verify email via 6-digit code.
   - Browse public showcase and search by category/platform.
   - Star applications and curate personal collections.
   - Manage profile, bio, display name, and password.

2. **Developer**:
   - All User capabilities.
   - Create, edit, and publish applications.
   - Upload and replace source code ZIP archives.
   - Control application visibility (`PUBLIC` or `PRIVATE`).

3. **Admin**:
   - Exactly one owner account (public admin registration is disallowed).
   - Inspect, temporarily disable (with auto-reactivating expiry), or permanently suspend accounts.
   - Moderate applications and perform permanent cascade deletions.
   - Monitor real-time audit stream and inspect security logs.

---

## Security & Archive Protection

- **ZIP Traversal (ZipSlip) Prevention**: Every archive entry is strictly inspected. Absolute paths, `../`, null bytes, and Windows drive roots are rejected.
- **Decompression Bomb Protection**: Enforces a maximum uncompressed size of 250MB, compression ratio limits, and a 10,000 file count ceiling.
- **Nested Archive Rejection**: Prevents archive-in-archive attacks (`.zip`, `.tar`, `.gz`, `.7z` inside uploaded archives are rejected).
- **Static Inspection**: Uploaded source code is never executed.
- **Safe URLs**: All image and runtime URLs are validated to ensure only HTTP/HTTPS protocols are permitted (rejecting `javascript:` and dangerous data URLs).
- **Audit Sanitization**: Passwords, tokens, codes, and private keys are redacted before persistence.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `APP_URL` | Public application URL (e.g. `http://localhost:3000` or Render URL) |
| `NODE_ENV` | `development` or `production` |
| `SESSION_SECRET` | Cryptographic secret key for signing session tokens (min 32 chars) |
| `MONGODB_URI` | MongoDB connection string (e.g. MongoDB Atlas or local MongoDB) |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project identifier |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account email with Google Drive permissions |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service Account private key (`-----BEGIN PRIVATE KEY-----...`) |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Google Drive folder ID serving as root storage location |
| `EMAIL_PROVIDER` | `development` (logs codes to console) or `smtp` for production |
| `EMAIL_FROM` | Sender address (e.g. `"DevVerse" <no-reply@devverse.io>`) |
| `ADMIN_BOOTSTRAP_TOKEN` | Secret token used during initial `/api/admin/init` setup |

---

## Google Cloud & Google Drive Setup

1. **Create Google Cloud Project**: Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. **Enable Google Drive API**: Navigate to **APIs & Services > Library**, search for **Google Drive API**, and click **Enable**.
3. **Create Service Account**:
   - Go to **IAM & Admin > Service Accounts**.
   - Click **Create Service Account**, name it `devverse-storage`.
   - Go to **Keys > Add Key > Create New Key > JSON**.
   - Extract `client_email`, `private_key`, and `project_id`.
4. **Create Root Drive Folder**:
   - In Google Drive, create a folder named `DevVerse`.
   - Copy the folder ID from the URL (`drive.google.com/drive/folders/<FOLDER_ID>`).
   - Share this folder with the Service Account email (`devverse-storage@...`) with **Editor** permissions.
5. **Configure `.env`**: Set `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, and `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

*Note: If Google Drive credentials are omitted during local development, DevVerse seamlessly uses a local storage adapter (`.storage/drive/`) with identical behavior.*

---

## Installation & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Provision Administrator Account
npm run init-admin

# 4. Start local development server
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

---

## Running Automated Tests

DevVerse includes a full suite of unit, integration, and security tests using Vitest:

```bash
# Run tests
npm test

# Type checking
npm run typecheck
```

Test coverage includes:
- Authentication & Password hashing with bcrypt
- ZIP archive safety (path traversal, zip bombs, nested archives)
- Language detection and vendor ignoring
- Application validation & URL-safe slug generation
- Collection duplicate prevention
- Administrative account status management and audit log sanitization

---

## Admin Initialization

DevVerse enforces **exactly one administrator account**:

1. **Option A: Via CLI**
   ```bash
   npm run init-admin
   ```
   Uses environment variables or generates a secure random master password.

2. **Option B: Via Web Interface**
   Navigate to [http://localhost:3000/admin/init](http://localhost:3000/admin/init). Enter master administrator credentials and your `ADMIN_BOOTSTRAP_TOKEN`.

Once provisioned, public administrator registration is permanently closed.

---

## Building & Running in Production

```bash
# 1. Build optimized production bundle
npm run build

# 2. Start production server
npm run start
```

---

## Deploying to Render

1. Create a **Web Service** on [Render](https://render.com/).
2. Connect your Git repository.
3. Select **Node** environment.
4. Set Build Command: `npm install && npm run build`
5. Set Start Command: `npm run start`
6. Add the environment variables specified in `.env.example`.
7. Alternatively, link `render.yaml` to deploy via Render Blueprint.

---

## API Reference

### Authentication
- `POST /api/auth/register`: Register user or developer account.
- `POST /api/auth/verify`: Verify 6-digit email code.
- `POST /api/auth/resend-code`: Resend verification code with cooldown rate limit.
- `POST /api/auth/login`: Authenticate and establish HTTP-only session cookie.
- `POST /api/auth/logout`: Revoke session cookie.
- `GET /api/auth/me`: Get current session and profile.
- `POST /api/auth/forgot-password`: Dispatch password reset code.
- `POST /api/auth/reset-password`: Reset password using code.
- `POST /api/auth/change-password`: Change password for authenticated user.

### Applications & Source Code
- `GET /api/applications`: Discover public apps with search, filters, and pagination.
- `POST /api/applications`: Publish new application (Developer or Admin).
- `GET /api/applications/[idOrSlug]`: Retrieve application details.
- `PUT /api/applications/[idOrSlug]`: Update application (Owner or Admin).
- `DELETE /api/applications/[idOrSlug]`: Cascade delete application and Drive storage.
- `POST /api/applications/[idOrSlug]/source`: Upload and inspect project ZIP archive.
- `GET /api/applications/[idOrSlug]/source`: Download complete source ZIP.
- `GET /api/applications/[idOrSlug]/source/file?path=...`: View single file content in browser.

### Collections & Favourites
- `GET /api/favorites`: List user's favorited applications.
- `POST /api/favorites`: Toggle favorite status.
- `GET /api/collections`: List user's collections.
- `POST /api/collections`: Create collection.
- `GET /api/collections/[id]`: View collection applications.
- `POST /api/collections/[id]/apps`: Add application to collection.
- `DELETE /api/collections/[id]/apps`: Remove application from collection.

### Administration
- `GET /api/admin/init`: Check administrator provisioning status.
- `POST /api/admin/init`: Provision the single administrator account.
- `GET /api/admin/users`: Search and inspect user accounts.
- `PATCH /api/admin/users/[id]`: Update user status (`ACTIVE`, `DISABLED`, `SUSPENDED`).
- `GET /api/admin/applications`: Search and moderate all applications.
- `PATCH /api/admin/applications/[id]`: Toggle visibility or soft-delete.
- `DELETE /api/admin/applications/[id]`: Permanently delete with storage purge.
- `GET /api/admin/activity`: Query paginated audit logs.
- `GET /api/admin/activity/stream`: Server-Sent Events (SSE) live audit stream.
- `GET /api/health`: Platform health check.
