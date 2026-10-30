# Changelog

## 0.2.0 — 2026-10-30

The package is the repository root. What the harness loads sits beside `package.json`
instead of inside `plugin/`, so the repository installs by name:

```powershell
dsh plugin --profile web add link:D:/Projects/dsh-collaborative-clarity
dsh plugin --profile web add github:ds-hu/dsh-collaborative-clarity
```

- Moved `index.js`, `client.js`, `artifacts.js`, `cordis.patch.yml`, `icon.svg` and
  `locale/` to the root; `plugin/test/` became `tests/`.
- Added `scripts/run-tests.mjs` and `pnpm test`: every test file runs, and one red file no
  longer hides the rest.
- Added `./package.json` to `exports`, so the Plugins panel reads the manifest's `icon`
  instead of falling back to the `<package>/icon` resource.
- Dropped the duplicate `plugin/LICENSE` (byte-identical to the root one) and folded
  `plugin/README.md` into the root README.
- No build step and no dependencies: there is no `prepare` script, so a GitHub install needs
  no `allowBuilds` approval.

**Upgrading from 0.1.0:** the installed link points at `…/plugin`, which no longer exists.
Remove and re-add the plugin; the Loader row id and the browser bundle id are unchanged.

## 0.1.0 — 2026-10-29

First installable version, verified in a real round.

- `clarity_round`: one decision, one or two variants, a named recommendation, at least one
  stated foreclosure; blocks until the user chooses, comments, revises, rejects, or cancels.
- `clarity_test`: a real-test gate with a cold-build record and a 3–7 step scenario; only a
  human-run pass marks a feature tested.
- Variants are files, not inline HTML, rendered by extension: document, prose, or numbered
  source with line anchors.
- The `Clarity` tab in the right sidebar, element / quote / line-range annotations, and a
  runtime `pendingInteraction` dot on the session row while a round waits.
- `clarity:guidance`, an always-on system section at order 2950, states the timing rule.
