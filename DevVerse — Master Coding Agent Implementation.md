# DevVerse — Master Coding-Agent Prompt

You are the lead architect, full-stack engineer, UI/UX engineer, security engineer, QA engineer, and deployment engineer for **DevVerse**. Build the application end-to-end from this specification. Do not merely scaffold it or create mockups. Implement, test, verify, and leave the repository runnable and deployable.

If an existing repository is provided, inspect it first and preserve useful functionality. Never invent files, APIs, architecture, dependencies, or existing behavior. For this project, assume a new/empty repository.

---

## 1. PRODUCT

**DevVerse** is a cloud-based application showcase and source-code sharing platform.

It allows people to discover applications, developers to publish applications and their source code, and the single platform owner/admin to manage the entire system.

It is a responsive web application for desktop, tablet, and mobile.

### Account types

**User**
- Anyone can register.
- Browse public applications.
- View developer profiles.
- Favourite applications.
- Create/manage collections.
- Manage profile/password.

**Developer**
- Anyone can register.
- Has normal user capabilities where appropriate.
- Create/manage developer profile.
- Create/edit/manage applications.
- Upload and preserve complete source code.
- Control application public/private visibility.

**Admin**
- Exactly one owner/admin account.
- Never publicly creatable.
- Complete platform-management privileges.
- Manage/monitor users, developers, applications, activity, logs, and account states.
- Temporarily disable accounts or permanently suspend them.
- Never expose passwords/password hashes.

---

# 2. STACK

Use a simple, maintainable TypeScript stack:

- **Next.js + React + TypeScript**
- **Tailwind CSS**
- Lightweight reusable component/design system
- **MongoDB** for application/database data
- **Google Drive API** for persistent source-code storage
- Secure HTTP-only cookie sessions
- Server-side validation, preferably Zod
- Practical email provider abstraction using Nodemailer
- Deploy to **Render**
- Must also run locally while continuing to use the configured cloud MongoDB and Google Drive.

Do not introduce microservices, Kubernetes, Redis, Kafka, Elasticsearch, etc. unless an actual requirement makes them necessary.

---

# 3. ENVIRONMENT

MongoDB:

```env
MONGODB_URI=
```

Google Drive:

```env
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
```

Also configure:

```env
APP_URL=
SESSION_SECRET=
EMAIL_PROVIDER=
EMAIL_FROM=
```

plus provider-specific email variables if required.

Create `.env.example`. Never commit or expose real credentials.

---

# 4. ARCHITECTURE

Use:

```text
UI
→ Next.js server/API layer
→ authentication/authorization
→ business services
→ MongoDB / Google Drive
```

Keep business logic out of UI components.

Create focused services/modules for:

- authentication
- users/developers
- applications
- favourites
- collections
- Google Drive/storage
- source processing
- language detection
- email
- admin
- activity/audit logs

MongoDB is the source of truth for metadata. Google Drive is the persistent source for uploaded source-code artifacts.

The Render filesystem must be treated as ephemeral.

---

# 5. AUTHENTICATION

Registration:

```text
Choose User or Developer
→ username + email + password
→ send six-digit email verification code
→ verify code
→ activate account
```

Requirements:

- unique normalized email
- unique username
- strong passwords
- Argon2id or bcrypt hashing
- never store plaintext passwords
- verification-code expiry
- single-use codes
- failed-attempt limits
- resend cooldown/rate limiting
- password reset
- password change
- login/logout
- secure persistent sessions

Use HTTP-only, Secure-in-production, appropriate SameSite cookies.

Never store authentication tokens in localStorage.

Every protected server operation must independently verify authentication, role, and resource ownership.

---

# 6. PROFILE

Users/developers can manage:

- username
- display name
- profile-picture URL
- description/bio
- password

Public developer profiles show appropriate public information and published applications.

Never expose:

- passwords/password hashes
- verification codes
- reset tokens
- session/authentication secrets
- Google credentials
- unnecessary private account information

---

# 7. APPLICATION CREATION

Developers create an application with:

- application name
- URL slug
- platform
- category
- thumbnail URL
- hero banner URL
- screenshots
- optional runtime URL
- source code
- visibility

Automatically generate a URL-safe slug from the name; allow customization and enforce uniqueness.

### Platforms

- Windows (.exe)
- Linux
- macOS (.dmg)
- Android (.apk)
- Web App

### Initial categories

- AI
- Gaming
- Utility
- Developer Tools
- Productivity
- Education
- Multimedia
- Finance
- Security
- Communication
- Other

Use controlled enums/data rather than arbitrary strings.

Validate all URLs and reject unsafe schemes such as `javascript:` and inappropriate `data:` URLs.

Visibility:

```text
PUBLIC
PRIVATE
```

Public applications appear in discovery. Private applications are accessible only to the owner and authorized admin.

---

# 8. APPLICATION DISCOVERY

Build:

- homepage/discovery
- application search
- category/platform filtering
- pagination
- application detail pages
- developer profiles

Do not load the entire database into the browser.

Application detail pages should show:

- name
- developer
- hero/banner
- thumbnail
- screenshots
- platform
- category
- language distribution
- source-code access
- runtime/Launch button when available
- favourite action
- relevant metadata

---

# 9. SOURCE-CODE SYSTEM

Source upload is a core feature.

Prefer uploading the project as a **ZIP archive** rather than thousands of individual browser uploads.

Flow:

```text
Upload
→ validate
→ safely inspect/extract
→ analyze
→ store in Google Drive
→ store metadata in MongoDB
→ READY
```

Processing states:

```text
NOT_UPLOADED
UPLOADING
PROCESSING
READY
FAILED
```

Never execute uploaded code.

Protect against:

- path traversal
- ZIP/decompression bombs
- huge archives
- huge extracted size
- excessive file count
- excessive directory depth
- oversized individual files
- malformed archives
- nested/resource-exhausting archives

Use configurable limits.

Clean temporary files after processing.

If processing fails, expose a safe error and ensure the application does not remain indefinitely stuck in `PROCESSING`.

Design processing so it can later be moved to a worker if scale requires it, but do not introduce unnecessary queue infrastructure now.

---

# 10. GOOGLE DRIVE

Use:

```env
GOOGLE_DRIVE_ROOT_FOLDER_ID
```

as the root storage location.

A practical structure is:

```text
DevVerse/
  applications/
    <application-id>/
      source/
      metadata/
```

Google Drive should be accessed only server-side.

Never send service-account credentials to clients.

Do not expose unrestricted Google Drive URLs for private content.

Private source-code requests must always pass application-level authorization.

Do not store large source archives/files inside MongoDB.

---

# 11. SOURCE BROWSER

Provide a GitHub-inspired but intentionally simpler repository interface:

- directory tree
- folder navigation
- file navigation
- source-file viewer
- syntax highlighting
- breadcrumbs/back navigation
- file metadata where useful

Do not build a full GitHub clone.

Store lightweight source-tree metadata in MongoDB where useful; keep large source content in Drive.

---

# 12. LANGUAGE DETECTION

After upload, detect programming languages and calculate their source percentage.

Example:

```text
TypeScript 54%
Python     27%
CSS        12%
HTML        7%
```

Use a reliable language-detection library where practical.

Ignore non-source/generated/vendor content such as:

```text
.git
node_modules
dist
build
coverage
vendor
.cache
```

Avoid counting generated/minified files where practical.

Store calculated results in MongoDB and recalculate when source changes.

---

# 13. FAVOURITES

Authenticated users can:

- favourite/unfavourite public applications
- see favourite state
- browse their favourites

Prevent duplicates.

Use an appropriate relation/collection rather than an unbounded user-ID array inside application documents.

---

# 14. COLLECTIONS

Users can create/manage collections containing applications.

Support:

- create
- rename/edit
- delete
- add application
- remove application
- view collection

Prevent duplicate applications.

Only collection owners can modify their collections.

Use a simple maintainable MongoDB design.

---

# 15. ADMIN SYSTEM

Create a protected `/admin` area.

Admin capabilities:

### Users/developers

- list/search
- inspect account details
- inspect account status
- inspect activity
- temporarily disable
- permanently suspend
- reactivate where appropriate

Account states:

```text
ACTIVE
DISABLED
SUSPENDED
```

Temporary disabling should support an expiration timestamp.

Suspended/disabled users must be prevented from authenticating and protected actions; active sessions should be invalidated where practical.

### Applications

Admin can:

- list/search
- inspect
- manage metadata
- manage visibility
- hide/remove applications
- manage associated source records
- delete applications where necessary

Destructive operations require confirmation and should clean related database/storage data appropriately.

---

# 16. ACTIVITY + AUDIT LOGGING

Track important events such as:

- registration
- verification
- login/logout
- failed login
- password changes/resets
- profile changes
- application creation/update
- source upload/processing
- favourite/unfavourite
- collection operations
- account disabling/suspension
- admin operations

Store appropriate metadata such as:

```text
timestamp
actor
actorRole
action
targetType
targetId
metadata
IP/user-agent where justified
```

Never log passwords, hashes, codes, tokens, cookies, or credentials.

Create an admin activity page with **near-real-time updates** using SSE or lightweight polling. Do not add Redis/WebSockets infrastructure merely for this.

---

# 17. DATABASE

Use MongoDB collections appropriate to the implementation, likely including:

```text
users
applications
collections
favorites
activityLogs
sessions
verificationCodes
```

Create only useful indexes, such as:

```text
users.email
users.username
applications.slug
applications.ownerId
applications.visibility
applications.category
applications.platform
favorites.userId + applicationId
collections.ownerId
activityLogs.timestamp
activityLogs.actorId
```

Every owned resource must have an explicit owner ID.

---

# 18. API / SERVER

Organize server functionality around resources, for example:

```text
/auth/*
/users/*
/applications/*
/collections/*
/favorites/*
/source/*
/admin/*
```

Use consistent validation and HTTP status codes.

Never trust client-provided role/ownership information.

Do not expose internal stack traces or infrastructure details in production responses.

---

# 19. SECURITY

Implement:

- server-side validation
- role-based authorization
- resource ownership checks
- secure cookies
- rate limiting for login/registration/verification/reset/admin-sensitive operations/uploads
- XSS protection
- safe URL validation
- CSRF protection where applicable
- upload/archive security
- secret protection
- privacy-conscious logging
- safe error handling

If the server does not need to fetch arbitrary runtime URLs, do not make it fetch them; this reduces SSRF risk.

Never execute uploaded source code.

---

# 20. UI/UX

Visual direction:

**Google-inspired design language without copying Google's branding/UI.**

Characteristics:

- professional
- modern
- clean
- functional
- utilitarian minimalism
- strong typography
- generous spacing
- restrained surfaces/shadows
- clear hierarchy
- polished but subtle animations

Avoid excessive:

- glassmorphism
- gradients
- decorative effects
- animation
- clutter

Create reusable components for:

- buttons
- inputs
- selects
- dialogs
- cards
- badges
- tabs
- dropdowns
- tables
- toasts
- skeletons
- empty/error states

Support:

- desktop
- tablet
- mobile
- keyboard navigation
- focus states
- semantic HTML
- accessible labels
- contrast
- alt text
- reduced-motion preferences

Mobile source browsing and admin tables must be intentionally responsive.

---

# 21. IMPORTANT UI STATES

Implement real:

- loading
- skeleton
- empty
- success
- validation-error
- unauthorized
- forbidden
- not-found
- server-error
- upload-failure
- processing-failure

Do not use fake data in production paths.

---

# 22. ROUTES

Use a clean route structure similar to:

```text
/
 /explore
 /apps/[slug]
 /apps/[slug]/source
 /developers/[username]

 /login
 /register
 /verify
 /forgot-password
 /reset-password

 /profile
 /favorites
 /collections
 /collections/[id]

 /developer
 /developer/apps
 /developer/apps/new
 /developer/apps/[id]
 /developer/apps/[id]/edit
 /developer/apps/[id]/source

 /admin
 /admin/users
 /admin/developers
 /admin/apps
 /admin/activity
 /admin/logs
```

Adapt to the actual Next.js routing architecture rather than creating unnecessary duplicate routes.

---

# 23. DEVELOPER DASHBOARD

Provide:

- application list
- create application
- edit application
- source upload/replace
- processing status
- public/private status
- useful application information/statistics
- direct link to public page

---

# 24. ADMIN INITIALIZATION

Admin must be provisioned securely through an initialization/bootstrap mechanism or controlled environment setup.

There must be no public admin registration.

Never use hard-coded/default credentials such as `admin/admin`.

Require a secure password during initialization and store only its secure hash.

Enforce exactly one administrative account.

---

# 25. DELETE / DATA CONSISTENCY

When deleting an application:

- verify authorization
- remove/soft-delete appropriate MongoDB records
- clean Google Drive data where appropriate
- clean favourites/collection references
- write audit log
- avoid orphaned storage

Use soft deletion where it improves safety.

---

# 26. PERFORMANCE

Use:

- database indexes
- server-side pagination
- lazy image loading
- cached/calculated language statistics
- efficient source retrieval
- streaming for large files where appropriate
- no N+1 queries

Do not introduce distributed caching prematurely.

---

# 27. OBSERVABILITY

Provide useful structured server logs for:

- application errors
- authentication/security events
- source-processing failures
- Google Drive failures
- important API failures

Never log secrets.

Add a simple:

```text
/api/health
```

endpoint without exposing sensitive infrastructure information.

---

# 28. TESTING

Do not stop at compilation.

Implement tests for critical business logic and workflows.

Cover at minimum:

### Authentication
- registration
- duplicate email/username
- verification
- invalid/expired code
- login/logout
- password change/reset
- disabled/suspended accounts

### Authorization
- user vs developer vs admin permissions
- resource ownership
- private application protection

### Applications
- create/edit
- slug collisions
- platform/category validation
- visibility
- URL validation

### Source
- valid upload
- invalid/corrupt archive
- path traversal
- size/file-count limits
- language detection
- Drive failures
- processing failures

### User features
- favourites
- duplicate prevention
- collections
- ownership

### Admin
- account management
- suspension
- application management
- activity/audit logs

Use unit/integration/E2E testing where it provides real value.

---

# 29. REQUIRED IMPLEMENTATION WORKFLOW

Follow this workflow, adapting it when appropriate:

```text
Inspect/Initialize
→ Architecture & schema
→ Infrastructure
→ Authentication
→ User/discovery features
→ Developer/application system
→ Google Drive/source processing
→ Admin system
→ Security hardening
→ UI/UX refinement
→ Automated tests
→ Build verification
→ End-to-end verification
→ Deployment documentation
```

At every phase:

- implement real functionality
- run relevant tests/checks
- fix failures before proceeding
- do not leave core TODOs/placeholders

---

# 30. FINAL VERIFICATION

Before declaring completion, actually run:

```text
install
lint
typecheck
tests
production build
production startup
```

Perform these end-to-end workflows:

### User

```text
register
→ verify email
→ login
→ edit profile
→ browse/search
→ favourite
→ create collection
→ add application
→ logout
```

### Developer

```text
register
→ verify
→ login
→ create application
→ customize slug
→ configure platform/category/media/runtime
→ upload source
→ process source
→ detect languages
→ browse source
→ change visibility
→ edit application
```

### Admin

```text
login
→ dashboard
→ inspect accounts/apps/activity
→ disable account
→ verify access is blocked
→ reactivate
→ inspect audit log
```

If external credentials/services were unavailable, clearly state what could not be verified rather than claiming success.

---

# 31. DOCUMENTATION

Create a concise but complete `README.md` covering:

- prerequisites
- installation
- environment variables
- MongoDB setup
- Google Cloud/Drive setup
- service-account permissions
- email configuration
- admin initialization
- local development
- testing
- production build
- Render deployment
- source-upload limits
- important operational/security notes

---

# 32. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

- User and Developer registration work.
- Six-digit email verification works.
- Authentication/session/password flows work securely.
- Profiles work.
- Developers can create/edit applications.
- Slugs work safely.
- Public/private visibility works.
- Source ZIP uploads work.
- Google Drive persistence works.
- Source processing works.
- Unsafe archives are rejected.
- Language percentages are detected and displayed.
- GitHub-like source browsing works.
- Favourites work.
- Collections work.
- Search/filter/pagination work.
- Developer profiles work.
- Exactly one secure admin account exists.
- Admin account/user/application/activity management works.
- Temporary disable/permanent suspension work.
- Activity/audit logging works.
- Near-real-time admin activity works.
- Responsive accessible UI works.
- Security protections are implemented.
- Tests pass.
- Type checking passes.
- Lint passes.
- Production build passes.
- Render deployment configuration is documented.
- No secrets are committed.
- No core functionality is left as a placeholder.

Finish with a concise engineering report containing the implemented architecture, important environment variables, database collections, Drive structure, security measures, tests/results, build results, known limitations, local setup, and Render deployment steps.

Prioritize **correctness, security, maintainability, usability, and actual verification** over unnecessary complexity.