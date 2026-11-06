# Restored calendar: review and publication

## Before merging

1. Compare the preview with the approved recovered original. Keep its header, weekly notices, calendar, grade filter and phone layout.
2. Require the Calendar checks workflow to pass. It runs against a local demo emulator, never the live Firebase project.
3. Export a backup of existing Realtime Database data and copy the active rules from Firebase > Realtime Database > Rules. This change does not export or change them automatically.
4. Identify the first administrator's actual Firebase UID. If the account already signed in, use Authentication > Users. Otherwise first complete Google sign-in on the current website. A sign-in creates identity but does not grant content permissions.
5. As the trusted Firebase project owner, add `members/{actualUID}/role` with String value `admin` in the console. Existing rules and the current main-branch code will ignore this record until the membership migration is active. Keep this UID and membership private.

## Switch code and rules together

The old version uses an `admin: true` custom claim. The replacement uses `members/{uid}/role` and denies all client membership writes. Both the page and the active database rules must use the replacement design.

1. Merge the reviewed PR into `main` when ready to publish the replacement.
2. Check GitHub Actions for the Pages deployment. In repository Settings > Pages, the source remains `main` and `/ (root)` when using branch publication.
3. In Firebase Realtime Database > Rules, replace the editor with the reviewed `database.rules.json` from the same merged revision, then click Publish. An authorized Firebase CLI session can instead deploy only database rules to project `ibshcal`.
4. Complete the two steps in the same maintenance session. During the switch, old and new code/rules can temporarily disagree; content may be read-only. Do not weaken the rules to make writes work.
5. Open the published URL from Pages, refresh, and sign in with the intended account. Verify the administrator/contributor status. If no account existed earlier, sign in now, assign its role through the trusted console, and refresh.

The draft PR itself does not merge, deploy the website, activate rules, or write production data. Do not automatically import the fictional demo records. No Firebase Hosting setup is needed for GitHub Pages.

## Manual acceptance

- Check the green header, weekly notice navigation, month navigation, date selection and grade filter on desktop and a phone.
- Signed out and unapproved: readable content, no save access.
- Contributor: create one disposable record, edit it and remove it; attempts to change others' records must fail.
- Administrator: create and moderate disposable content, preserving ownership and creation time when editing.
- Refresh or open a second browser to confirm saved content and changes persist.
- Revoke a test member through the console and check that editing access disappears.
- Verify a direct membership write by any website client is denied. Remove disposable records after checking.

## Existing data and rollback

Existing `notices` and `events` stay in place. Old notices derive a display date from `createdAt`; missing grade/time/place values use display defaults. Editing uses a partial update so unrelated existing fields are not removed. Rules allow old records with their earlier optional fields absent.

Before this work, the main-branch revision was `dbee785292252455454fc825952a8df4c5ef3ade`; it remains available in Git history. To roll back, restore the old code **and** the saved active rules as a pair. Reverting only the page or only the rules leaves mismatched permissions. Retain database backups, and do not delete or rebuild the existing database.
