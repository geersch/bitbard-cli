# Design: GitHub Release Pipeline & Install Script

**Date:** 2026-05-07
**Status:** Approved

## Overview

Replace the current `install.sh` (which clones the repo and builds on the user's machine) with a distribution model that:

1. Builds a self-contained standalone binary on merge to `master` via a GitHub Actions release workflow
2. Publishes the binary as a GitHub Release asset
3. Provides a rewritten `install.sh` that downloads and installs the pre-built binary — no git, node, or bun required on the user's machine

---

## 1. Version Derivation

### Current state

`buildVersion()` in `packages/cli/vite.config.ts` computes:

```
YY.MMDD.HHmm+sha  (e.g. 26.0507.1430+a3f2c1)
```

using the latest git commit's Unix timestamp and short SHA.

### Change

Replace `+` with `-` as the SHA separator to produce URL-safe, GitHub-tag-safe version strings:

```
YY.MMDD.HHmm-sha  (e.g. 26.0507.1430-a3f2c1)
```

This single character change makes the version string consistent in all contexts:

- Baked into the binary at build time (via Vite's `define.__APP_VERSION__`)
- Used as the GitHub Release tag: `v26.0507.1430-a3f2c1`

The release workflow replicates the same derivation logic in shell to produce an identical string before creating the tag.

---

## 2. Build: Standalone Binary via `bun build --compile`

### Swift helper path problem

The CLI currently resolves the Swift helper binaries at runtime using:

```typescript
const binDir = process.env.BITBARD_BIN_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'bin');
```

This works during development because `import.meta.url` resolves to `dist/bitbard.js`, so `bin` is `dist/bin/` — right where the Swift helpers are compiled.

With `bun build --compile`, the JS bundle is embedded inside the native executable. `import.meta.url` points to the executable itself, not a directory containing a `bin/` folder. The derived path becomes meaningless.

### Solution: bake the install path at build time

Add a new Vite `define` constant `__BIN_DIR__` in `packages/cli/vite.config.ts`:

```typescript
define: {
  __APP_VERSION__: JSON.stringify(buildVersion()),
  __BIN_DIR__: JSON.stringify(
    process.env.BITBARD_INSTALL_BIN_DIR
      ?? join(dirname(fileURLToPath(import.meta.url)), 'dist', 'bin')
  ),
}
```

- In development (`bun run build` locally): `BITBARD_INSTALL_BIN_DIR` is unset → `__BIN_DIR__` defaults to the `dist/bin/` path relative to `vite.config.ts`, preserving current behaviour.
- In the release workflow: `BITBARD_INSTALL_BIN_DIR=~/.local/share/bitbard/bin` is set before `bun run build` → the install path is baked into the bundle.

The three callers (`alert.ts`, `flux.ts`, `truetone.ts`) are updated to use `__BIN_DIR__` instead of the `import.meta.url`-derived path, while keeping `process.env.BITBARD_BIN_DIR` as a runtime override for testing:

```typescript
const binDir = process.env.BITBARD_BIN_DIR ?? __BIN_DIR__;
```

A TypeScript declaration for `__BIN_DIR__` must be added (same pattern as `__APP_VERSION__`).

### Compile step

At release time, after `bun run build` produces `packages/cli/dist/bitbard.js` (with the install path baked in), the release workflow runs:

```sh
bun build --compile --target=bun-darwin-arm64 packages/cli/dist/bitbard.js --outfile bitbard
```

This produces a true standalone executable: no Node.js or Bun runtime required on the user's machine.

The Swift helper binaries (compiled by the Vite `swiftPlugin` into `packages/cli/dist/bin/`) are included in the release tarball and installed to `~/.local/share/bitbard/bin/` on the user's machine.

### Target platforms (initial)

| Platform | Arch  | Asset name                    |
| -------- | ----- | ----------------------------- |
| macOS    | arm64 | `bitbard-darwin-arm64.tar.gz` |

Additional platforms (macOS x64, Linux x64/arm64) can be added later by extending the release matrix.

---

## 3. GitHub Actions: Release Workflow

**File:** `.github/workflows/release.yml`
**Trigger:** `push` to `master`

### Steps

1. `actions/checkout@v4` with full history (`fetch-depth: 0`) — required for `git log -1 --pretty=%ct`
2. `oven-sh/setup-bun@v2`
3. `bun install --frozen-lockfile`
4. Compute version in shell, replicating `buildVersion()`:
   ```sh
   COMMIT_TS=$(git log -1 --pretty=%ct)
   SHA=$(git rev-parse --short HEAD)
   # format as YY.MMDD.HHmm-sha
   VERSION=$(date -u -r "$COMMIT_TS" "+%y.%m%d.%H%M")-$SHA
   ```
5. Set `BITBARD_INSTALL_BIN_DIR=$HOME/.local/share/bitbard/bin` and run `bun run build` — Vite bakes the install path into the bundle, builds the JS bundle, and compiles Swift helpers (macOS runner only)
6. `bun build --compile` — produce standalone `bitbard` binary
7. Package assets (run from repo root; paths are relative to root):
   ```sh
   tar -czf bitbard-darwin-arm64.tar.gz bitbard packages/cli/dist/bin/
   ```
8. Create GitHub Release and upload asset. If the tag already exists (e.g. workflow re-run), skip gracefully rather than failing — check with `gh release view "v$VERSION"` first:
   ```sh
   if ! gh release view "v$VERSION" &>/dev/null; then
     gh release create "v$VERSION" bitbard-darwin-arm64.tar.gz \
       --title "v$VERSION" \
       --notes "Automated release from master"
   fi
   ```

**Note:** Quality checks (lint, type-check, tests) are the responsibility of `ci.yml`, which runs on all PRs. The release workflow assumes `master` is always in a passing state. Branch protection should require CI to pass before merge to `master`.

**Note:** `date -u -r "$COMMIT_TS"` uses BSD `date` syntax, which is macOS-specific. This is intentional since the runner is `macos-latest`. If the runner ever changes to Linux, use `date -u -d "@$COMMIT_TS"` instead.

---

## 4. Install Script Rewrite

**File:** `install.sh`

The script is rewritten from scratch. No build tools required on the user's machine.

### Options

| Flag                    | Description                |
| ----------------------- | -------------------------- |
| `-h`, `--help`          | Show usage                 |
| `-v`, `--version <ver>` | Install a specific version |
| `--no-modify-path`      | Skip shell config patching |

### Install directory

| Path                          | Contents                       |
| ----------------------------- | ------------------------------ |
| `~/.local/bin/bitbard`        | Main standalone binary         |
| `~/.local/share/bitbard/bin/` | Swift helper binaries (if any) |

### Flow

```
1. Parse arguments
2. Detect platform (OS + arch); error if unsupported
3. Resolve version:
   - If --version: verify release exists via GitHub API
   - Else: fetch latest release tag from GitHub API
4. Check if already installed at same version → exit early if so
5. Download tarball with progress bar (curl)
6. Extract to temp dir
7. Move binaries to install dirs; chmod 755
8. Patch shell config to add ~/.local/bin to $PATH
9. Print success message
```

### Platform detection

```sh
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
[[ "$arch" == "x86_64" ]] && arch="x64"
[[ "$arch" == "aarch64" ]] && arch="arm64"
```

Supported combos on first release: `darwin-arm64`. Unsupported combos produce a clear error.

### Version resolution

```sh
# Latest
VERSION=$(curl -sf https://api.github.com/repos/geersch/bitbard-cli/releases/latest \
  | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')

# Specific
http_status=$(curl -sI -o /dev/null -w "%{http_code}" \
  "https://github.com/geersch/bitbard-cli/releases/tag/v${VERSION}")
[[ "$http_status" == "404" ]] && error "Release v${VERSION} not found"
```

### Idempotency

If `bitbard` is already installed and `bitbard --version` matches the target version, exit 0 with a "already installed" message. This check depends on the binary correctly implementing a `--version` flag that outputs the version string in `YY.MMDD.HHmm-sha` format. If `--version` is unimplemented or produces different output, the idempotency check will always fail (treated as not installed) — a safe fallback.

### PATH patching

Detect current shell (bash, zsh, fish). Find the appropriate config file. Append the path export only if not already present. Skip if `--no-modify-path` is set.

Shell-specific syntax:

- bash / zsh: `export PATH="$HOME/.local/bin:$PATH"`
- fish: `fish_add_path $HOME/.local/bin`

Fish requires different syntax; do not use `export PATH=...` for fish shells.

---

## 5. What Changes

| File                                            | Change                                                          |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `packages/cli/vite.config.ts`                   | Change `+` to `-` in `buildVersion()`; add `__BIN_DIR__` define |
| `packages/cli/src/env.d.ts` (or equivalent)     | Declare `__BIN_DIR__: string` alongside `__APP_VERSION__`       |
| `packages/core/src/alert.ts`                    | Use `__BIN_DIR__` instead of `import.meta.url`-derived path     |
| `packages/cli/src/commands/display/flux.ts`     | Use `__BIN_DIR__` instead of `import.meta.url`-derived path     |
| `packages/cli/src/commands/display/truetone.ts` | Use `__BIN_DIR__` instead of `import.meta.url`-derived path     |
| `.github/workflows/release.yml`                 | New file — release pipeline                                     |
| `install.sh`                                    | Full rewrite                                                    |

`ci.yml` is unchanged.

---

## 6. Constraints & Assumptions

- The release workflow runner is `macos-latest` (required for Swift compilation)
- `bun build --compile` with `--target=bun-darwin-arm64` is available in the Bun version used
- The GitHub repo has `GITHUB_TOKEN` with `contents: write` permission for `gh release create`
- Branch protection on `master` requires CI to pass — release workflow assumes clean state
- `curl` and `tar` are assumed present on user machines (standard on macOS/Linux)
