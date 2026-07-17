# LINE Account Linking Integration (May 6, 2026)

**Overview**: Implemented LINE account linking for students. Tutors generate a magic link, send it to the student, and the student links their LINE account via OAuth flow.

**Database Changes**:
- Added `lineUserId String? @unique` to `Student` model
- Added `LineLinkToken` model: `id`, `studentId`, `token` (unique), `expiresAt`, `usedAt`
- Token expires in 24 hours, marked as used once linked

**Backend Implementation**:
- **Lib** (`lib/line.ts`):
  - `exchangeCodeForToken(code)` - Exchanges LINE OAuth code for access token
  - `getLineProfile(accessToken)` - Fetches LINE user profile (userId, displayName)
  - `buildLineAuthUrl(state)` - Builds LINE Login authorization URL

- **Repository** (`repositories/line.repository.ts`):
  - `createToken(studentId)` - Generates UUID token with 24h expiry
  - `findValidToken(token)` - Finds non-expired, unused token
  - `markTokenUsed(tokenId)` - Marks token as consumed
  - `linkStudentLineUser(studentId, lineUserId)` - Stores LINE userId on student

- **Service** (`services/line.service.ts`):
  - `generateLinkToken(studentId)` - Validates student exists and not already linked, creates token, returns `{ token, linkUrl, expiresAt }`
  - `getAuthUrl(token)` - Validates token, returns LINE OAuth authorization URL
  - `handleCallback(code, state)` - Exchanges code for LINE profile, links student, marks token used

- **Routes** (`routes/line.ts`):
  - `POST /v1/line/link-token` (auth required) - Generate magic link for a student
  - `GET /v1/line/auth-url?token=xxx` (public) - Get LINE Login URL
  - `GET /v1/line/callback?code=&state=` (public) - OAuth callback, redirects to frontend

- **Environment Variables**:
  - `LINE_LOGIN_CHANNEL_ID` - LINE Login channel ID from LINE Developers Console
  - `LINE_LOGIN_CHANNEL_SECRET` - LINE Login channel secret
  - `LINE_LINK_REDIRECT_URL` - Backend callback URL (default: `http://localhost:3000/v1/line/callback`)
  - `FRONTEND_URL` - Frontend base URL for generating magic links (default: `http://localhost:3001`)

**Frontend Implementation**:
- **Mutation** (`use-generate-line-link.ts`):
  - `useGenerateLineLink()` - Mutation to generate LINE link for a student

- **Screens** (`line-link-screen.tsx`):
  - Public page at `/line-link?token=xxx` - Shows "Connect with LINE" button
  - Handles success/error states from OAuth callback redirect
  - Success: `/line-link?success=true&name=DisplayName`
  - Error: `/line-link?error=link_failed`

- **Route** (`routes/line-link.tsx`):
  - Public TanStack Router route with search param validation

- **Components**:
  - Updated `StudentCard` to show LINE linked badge (green "LINE" badge with checkmark)
  - Added "Link LINE" dropdown menu item for unlinked students
  - Updated `StudentScreen` with `handleLinkLine()` - confirmation dialog, generates link, copies to clipboard

- **i18n** (`students.ts`):
  - Added `line.linkLabel`, `line.linkConfirm`, `line.linkGenerate`, `line.linkCopied`, `line.alreadyLinked`

**Linking Flow**:
1. Tutor clicks "Link LINE" on student card dropdown
2. Confirmation dialog appears
3. Tutor confirms → backend generates magic link token → link copied to clipboard
4. Tutor sends link to student via any channel
5. Student opens link → sees "Connect with LINE" page
6. Student clicks "Connect" → redirected to LINE Login
7. Student authorizes → LINE redirects to backend callback
8. Backend exchanges code for LINE profile, stores `lineUserId` on student
9. Backend redirects to frontend success page
10. Student sees "Linked Successfully!" page

**Files Created**:
- `backend/src/lib/line.ts`
- `backend/src/types/line.types.ts`
- `backend/src/schemas/line.schema.ts`
- `backend/src/repositories/line.repository.ts`
- `backend/src/services/line.service.ts`
- `backend/src/routes/line.ts`
- `backend/prisma/migrations/20260505000000_add_line_linking/migration.sql`
- `frontend/src/hooks/mutations/use-generate-line-link.ts`
- `frontend/src/screens/line-link-screen.tsx`
- `frontend/src/routes/line-link.tsx`

**Files Modified**:
- `backend/prisma/schema.prisma` - Added `lineUserId` to Student, added `LineLinkToken` model
- `backend/src/lib/env.ts` - Added LINE env vars
- `backend/src/types/student.types.ts` - Added `lineUserId` to StudentDTO
- `backend/src/types/index.ts` - Added line types export
- `backend/src/repositories/student.repository.ts` - Updated toDTO to include lineUserId
- `backend/src/schemas/student.schema.ts` - Added lineUserId to StudentSchema
- `backend/src/schemas/index.ts` - Added line schema export
- `backend/src/repositories/index.ts` - Added line repository export
- `backend/src/services/index.ts` - Added line service export
- `backend/src/routes/index.ts` - Added LINE routes
- `backend/src/index.ts` - Added LINE tag to OpenAPI docs
- `frontend/src/types/student.ts` - Added lineUserId to Student interface
- `frontend/src/components/students/student-card.tsx` - Added LINE badge and link action
- `frontend/src/components/students/student-drawer.tsx` - Updated type import
- `frontend/src/screens/student-screen.tsx` - Added LINE link handler
- `frontend/src/lib/i18n/locales/en/students.ts` - Added LINE translations
