# GitHub Pages publication

Repository: https://github.com/HLIEN-cyber/cal

## Current release gates

- Website changes are local and have not been pushed.
- Database emulator tests have not executed: the runtime download is blocked by network policy (storage.googleapis.com).
- Rules currently grant writes only to users with the `admin: true` custom claim. Separate approval status and role-specific permissions are not implemented. Resolve the intended role policy before release.
- GitHub Pages configuration could not be inspected because the GitHub API returned Forbidden.

## Prepare Firebase

1. Enable Google sign-in in Firebase Authentication for project ibshcal.
2. Add `hlien-cyber.github.io` to Authentication's authorized domains. If using a custom domain, add that hostname too.
3. Assign administrator claims from a trusted Admin SDK environment.
4. Run `npm ci` and `npm test` with Node 22 and Java 21 available; require the permission tests to pass.
5. Review database.rules.json and deploy it separately using an authorized Firebase CLI session: `npx firebase deploy --only database --project ibshcal`.

## Publish after release approval

1. Review and commit the website, rules, tests, lockfile and documentation, then push a branch and merge its reviewed PR into main.
2. In the GitHub repository, open Settings → Pages.
3. Select Deploy from a branch, branch main, folder / (root), then Save. This step publishes the site.
4. Obtain the live URL from GitHub Pages. The standard URL is https://hlien-cyber.github.io/cal/ unless a custom domain is configured.
5. Verify signed-out public reads, Google sign-in, denied unapproved writes and permitted administrator writes. Use disposable test records and remove them afterward.

GitHub Pages serves index.html directly. Firebase rules are deployed separately; committing database.rules.json does not activate them. Do not publish node_modules, credentials, or emulator logs.
