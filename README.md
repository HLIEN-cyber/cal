# IBSH Calendar

Static Firebase web app for project `ibshcal`. Serve this directory with `python3 -m http.server 8000` and open it in a browser. The Firebase SDK loads from Google's CDN. No frontend build is required; Analytics is intentionally not initialized.

Notices and events are publicly readable. Google sign-in alone does not permit publishing: only users with the Firebase Auth custom claim `admin: true` can create, update or delete records. Assign that claim through a trusted Admin SDK environment, never browser code. Users must sign in again after claims change. The UI supports publishing and deleting; updates are also permitted by rules. Event dates are date-only values; rules validate their format, not month-specific day counts.

## Firebase setup

1. Enable Google in Firebase Authentication → Sign-in method and set its support email.
2. Add the serving hostname to Authentication → Settings → Authorized domains (including localhost for local development when needed).
3. Confirm the Realtime Database instance is `https://ibshcal-default-rtdb.firebaseio.com`.
4. Review and deploy rules using an authorized Firebase CLI session: `npx firebase deploy --only database --project ibshcal`.

The included web configuration is a public client identifier, not an administrator credential. Database rules enforce access. No production deployment is performed by tests.

## Permission tests

Use Node 22+ and Java 21+, then `npm ci` and `npm test`. Tests run against the local Realtime Database emulator with the demo project `demo-ibshcal`. They cover public reads, denied anonymous/non-admin writes, administrator CRUD, schema validation, authorship, and denied private paths. The first emulator run downloads its runtime.
