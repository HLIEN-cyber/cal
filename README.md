# IBSH Calendar

This version restores the approved green school noticeboard, weekly notices, month calendar, date selection, grade filters and mobile layout. Firebase project `ibshcal` and Web app `ibsh_cal` provide Google sign-in and Realtime Database storage. There is no frontend build step.

## Preview

Serve the repository with a static HTTP server. Open `index.html` for live data, or `index.html?demo=1` for an offline layout preview with the original fictional school records. Demo mode does not load Firebase, authenticate users or write data. The live page never falls back to mock data when the database is empty or unavailable.

## Membership permissions

The website and `database.rules.json` both use `members/{firebaseUID}/role`.

| Visitor | Content access |
| --- | --- |
| Signed out | Read notices and events |
| Signed in, without an approved role | Read content and their own membership status |
| `contributor` | Create content and edit/delete their own records |
| `admin` | Create, edit and delete all content |

All website clients, including administrators, are denied membership writes and listing other users' memberships. The trusted Firebase project owner manages roles in the console. There is no client role selector or automatic promotion. The old `admin: true` custom claim no longer grants access.

After the new code and rules are active:

1. Sign in on the website once with Google.
2. In Firebase Authentication > Users, copy that account's Firebase UID. The website also offers **Copy my UID** after sign-in.
3. In Realtime Database > Data, use Add child (+) to create `members`, then the actual UID as its child key, then `role` with String value `admin`.
4. Refresh the website. Approved roles also update through a live membership listener. Other approved teachers use String value `contributor`.

No `group` field is required. Do not type `members` into the root's value field. Google account selection chooses identity; it does not assign a website role.

## Firebase and publication

Enable Google under Authentication > Sign-in method and set its support email. Add the published website's hostname under Authentication > Settings > Authorized domains (no scheme or `/cal/` path). For local real sign-in, explicitly authorize localhost if required.

Review [the publication and migration instructions](docs/PUBLISH.md) before replacing the existing site. Deploying GitHub files does not publish Firebase rules. This source change does not deploy to Firebase or modify live data by itself.

The Firebase web config is a public client configuration, not an administrator credential. Do not add service account files or private credentials to this repository.

## Data compatibility

Collections remain `notices` and `events`. Required base fields are `title`, `body`, `authorUid`, and `createdAt`; events also require `date`. New records include `date` (`YYYY-MM-DD`) and `grade` (`all`, `K`, `1`–`5`). Notices use `type`; events use optional `time` (`HH:mm` or empty) and `place`.

Earlier notices without a `date` use the local date of `createdAt` for weekly display. Earlier records without a grade appear under All grades; earlier events without time/location remain visible. Invalid calendar records are ignored in the view without deleting or rewriting them. Editing preserves original `authorUid` and `createdAt`. No records are seeded, migrated or deleted automatically.

Date-only fields use the device's local calendar date and avoid UTC parsing shifts. The form checks actual calendar dates; rules check date format and ranges, rather than month-specific day counts. Public records may not contain private school information.

## Tests

- `npm run test:calendar`: dependency-free date, legacy-data and form/role checks.
- `npm run test:rules`: real Realtime Database emulator tests against project `demo-ibshcal`. Requires Node 22+ and Java 21+, then `npm ci`. The first run downloads the emulator runtime.
- `npm test`: both suites. GitHub Actions installs Java and runs both suites on the draft branch/PR. Emulator tests never target the production project.

The access tests cover pending users, contributors, administrator moderation, revoked membership, immutable ownership/timestamps, obsolete admin claims, validation, denied membership changes and existing record compatibility. Use manual Google login and a disposable record for the final production check after deployment.
