---
description: Bump the app release (APP_RELEASE in index.html and CACHE in sw.js) so installed apps update
---

Bump the Income Factory release.

1. Read the current value of `window.APP_RELEASE` in `index.html` and of `CACHE` in `sw.js`. They must match (`CACHE` is `income-factory-<release>`); if they don't, say so before changing anything.
2. Today's date is `AAAA-MM-DD` (use the session's current date).
   - If the current release is from an earlier day, the new release is today's date.
   - If it is already today (`AAAA-MM-DD` or `AAAA-MM-DD.N`), the new release is today's date with the next number: `.2` after a plain date, otherwise `N+1`.
3. Write the new value in both places, with the same value.
4. Report old → new, and how the start screen will show it: "Última release: DD/MM/AAAA · #N", or without "· #N" for a plain date.

$ARGUMENTS
