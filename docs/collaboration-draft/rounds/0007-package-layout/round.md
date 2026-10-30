# Round 0007 — Package layout

**Decision:** Should the package be the repository root as it stands, or the root with
`dsh-personal-track`'s source→`lib/` build around it?
**Variant A:** *The repository is the package* — every file the harness loads at the root, no
build, no dependencies.
**Variant B:** *Source builds to `lib/`* — `src/host`, `src/client`, esbuild, `prepare`.
**Accepted:** A.
**Forecloses:** A leaves the client half as one hand-written file with the loader wrapper typed
in it, and gives the root generic filenames that only `package.json` explains; splitting the
client later means adopting B on a live plugin. B turns every GitHub install into an
`allowBuilds` approval keyed by commit SHA, and makes a stale `lib/` install silently.

## Why this round

The package lives in `plugin/`, so the only thing that installs it is
`link:…/plugin`. The repository root has no manifest: `dsh plugin --profile web add
link:D:/Projects/dsh-collaborative-clarity` has nothing to read, and
`github:ds-hu/dsh-collaborative-clarity` clones a repository with no package at its top.
Every other plugin on this machine — personal-track, pocket, toolbridge — keeps the manifest
at the root, and personal-track additionally builds `src/` into `lib/`.

The first half of that gap is not a decision: a package that is not at the root cannot be
installed by name. The second half is: our code has no dependencies at all (host imports only
`node:` builtins, client requires only `react`), so a build would be there for the compiler and
the module split, not for the install.

## Fidelity

**Real:** the file trees, the install commands, the `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`
wording (transcribed from personal-track's README, where it was hit for real).
**Mocked:** nothing — both variants are file promises, and the tree is the deliverable.
**Omitted:** the profile's `package.json` edit and the restart; the docs tree below
`docs/collaboration-draft/`, unchanged in both.

## Outcome

Accepted A. The package moved to the repository root — `package.json`, `index.js`,
`client.js`, `artifacts.js`, `cordis.patch.yml`, `icon.svg`, `locale/` — and `plugin/test/`
became `tests/` with `scripts/run-tests.mjs` running every file. `plugin/LICENSE` was dropped
because it was byte-identical to the root one, and `plugin/README.md` folded into the root
README.

Verified rather than assumed:

- `npm pack --dry-run` ships exactly nine files (the four runtime files, the patch, the icon,
  the locale, `LICENSE`, `README.md`) and no `docs/`, `tests/` or `scripts/`;
- `scripts/verify-package.mjs` resolves `<package>`, `<package>/client`,
  `<package>/package.json`, `<package>/icon` and `<package>/locale/en.json` through Node's own
  resolver against a junctioned install, and asserts the `files`, icon and locale rules the
  Plugins reader enforces. Four deliberate violations — a missing export, a missing `files`
  entry, a locale file named `zh_CN.json`, and a patch row naming another package — each fail
  it, and the manifest was restored byte-exact (sha256 compared) after every one;
- the profile link now points at the repository root, with the bundle still in
  `dsh.profile.bundles`.

One leftover the move could not remove: the empty `plugin/` directory is still held open by
the running DSH process (`WinError 32`), so it disappears only after a restart.
