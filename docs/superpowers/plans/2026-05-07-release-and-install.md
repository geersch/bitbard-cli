# Release Pipeline & Install Script Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the clone-and-build install script with a GitHub Release pipeline that ships a pre-built standalone binary, and a rewritten install script that downloads and installs it.

**Architecture:** Vite bakes `__BIN_DIR__` into the JS bundle at build time so the compiled standalone binary knows where to find the Swift helpers without any runtime path trickery. A new `release.yml` GitHub Actions workflow builds and publishes a tarball on every push to `master`. A rewritten `install.sh` fetches the latest release from the GitHub API, downloads the tarball, and installs the binary and Swift helpers — no git, node, or bun required on the user's machine.

**Tech Stack:** Bash, GitHub Actions, Bun (compile), Vite (define), TypeScript ambient declarations.

**Spec:** `docs/superpowers/specs/2026-05-07-release-and-install-design.md`

---

## Chunk 1: Bake `__BIN_DIR__` into the bundle

### File map

| Action | File                                            |
| ------ | ----------------------------------------------- |
| Modify | `packages/cli/vite.config.ts`                   |
| Modify | `packages/cli/vitest.config.ts`                 |
| Modify | `packages/cli/src/env.d.ts`                     |
| Create | `packages/core/src/env.d.ts`                    |
| Modify | `packages/core/src/alert.ts`                    |
| Modify | `packages/cli/src/commands/display/flux.ts`     |
| Modify | `packages/cli/src/commands/display/truetone.ts` |

---

### Task 1.1: Update `vite.config.ts` — fix version separator and add `__BIN_DIR__` define

**Files:**

- Modify: `packages/cli/vite.config.ts`

`buildVersion()` currently uses `+` as the SHA separator. Change it to `-`. Also add a `__BIN_DIR__` define that reads `BITBARD_INSTALL_BIN_DIR` from the environment (set during release builds) and falls back to the local `dist/bin/` path for development.

- [ ] Open `packages/cli/vite.config.ts`. Change `buildVersion()` to return `YY.MMDD.HHmm-sha` (replace `+` with `-`):

```typescript
return `${yy}.${MM}${DD}.${HH}${mm}-${sha}`;
```

- [ ] Add the `__BIN_DIR__` define in the `defineConfig` block, immediately after `__APP_VERSION__`:

```typescript
define: {
  __APP_VERSION__: JSON.stringify(buildVersion()),
  __BIN_DIR__: JSON.stringify(
    process.env.BITBARD_INSTALL_BIN_DIR
      ?? join(dirname(fileURLToPath(import.meta.url)), 'dist', 'bin')
  ),
},
```

The fallback (`dist/bin` relative to the config file, i.e. `packages/cli/dist/bin`) matches where the Swift helpers are compiled during local development.

- [ ] Run a local build to verify it compiles without errors:

```bash
bun run build
```

Expected: builds successfully, `packages/cli/dist/bitbard.js` produced.

---

### Task 1.2: Add `__BIN_DIR__` to ambient type declarations

**Files:**

- Modify: `packages/cli/src/env.d.ts`
- Create: `packages/core/src/env.d.ts`

The TypeScript compiler type-checks source files across both `packages/cli` and `packages/core`. Both need the ambient declaration so the `__BIN_DIR__` global doesn't produce a type error.

- [ ] Edit `packages/cli/src/env.d.ts` — add the `__BIN_DIR__` declaration:

```typescript
declare const __APP_VERSION__: string;
declare const __BIN_DIR__: string;
```

- [ ] Create `packages/core/src/env.d.ts` with the same content (core has its own tsconfig scope):

```typescript
declare const __BIN_DIR__: string;
```

- [ ] Run the type check to confirm no errors:

```bash
bun run check-types
```

Expected: exits 0, no type errors.

---

### Task 1.3: Update vitest config to define `__BIN_DIR__` for tests

**Files:**

- Modify: `packages/cli/vitest.config.ts`

Vitest has its own `define` block that stubs `__APP_VERSION__`. It needs the same treatment for `__BIN_DIR__`, otherwise tests that import files using `__BIN_DIR__` will fail with a ReferenceError.

- [ ] Edit `packages/cli/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  define: {
    __APP_VERSION__: '"0.0.0-test"',
    __BIN_DIR__: JSON.stringify(join(import.meta.dirname, 'dist/bin')),
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
```

- [ ] Run the cli tests to confirm they still pass:

```bash
bun run test
```

Expected: all tests pass.

---

### Task 1.4: Update `alert.ts` to use `__BIN_DIR__`

**Files:**

- Modify: `packages/core/src/alert.ts`

Replace the `import.meta.url`-based path resolution with `__BIN_DIR__`. Keep `process.env.BITBARD_BIN_DIR` as a runtime override (useful for testing).

- [ ] Edit `packages/core/src/alert.ts`:

Remove the `dirname` and `fileURLToPath` imports (no longer needed). Keep `join` — it is still used to construct `BINARY`. Update the `binDir` line:

```typescript
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { isMacOS } from './platform.js';

const binDir = process.env.BITBARD_BIN_DIR ?? __BIN_DIR__;
const BINARY = join(binDir, 'alert');
```

- [ ] Run type check:

```bash
bun run check-types
```

Expected: exits 0.

---

### Task 1.5: Update `flux.ts` to use `__BIN_DIR__`

**Files:**

- Modify: `packages/cli/src/commands/display/flux.ts`

Same pattern as `alert.ts`.

- [ ] Edit `packages/cli/src/commands/display/flux.ts`:

Remove the `dirname`, `fileURLToPath` imports (no longer needed) and update the `binDir` line:

```typescript
import { defineCommand } from 'citty';
import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';

const STATE_DIR = join(homedir(), '.config', 'bitbard');
const STATE_FILE = join(STATE_DIR, 'flux.json');

// The binary lives at the path baked in at build time (or overridden via env for testing)
const binDir = process.env.BITBARD_BIN_DIR ?? __BIN_DIR__;
const BINARY = join(binDir, 'flux');
```

- [ ] Run type check and tests:

```bash
bun run check-types && bun run test
```

Expected: exits 0, all tests pass.

---

### Task 1.6: Update `truetone.ts` to use `__BIN_DIR__`

**Files:**

- Modify: `packages/cli/src/commands/display/truetone.ts`

- [ ] Edit `packages/cli/src/commands/display/truetone.ts`:

Remove the `dirname`, `fileURLToPath` imports and update the `binDir` line:

```typescript
import { defineCommand } from 'citty';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';

// The binary lives at the path baked in at build time (or overridden via env for testing)
const binDir = process.env.BITBARD_BIN_DIR ?? __BIN_DIR__;
const BINARY = join(binDir, 'truetone');
```

- [ ] Run the full quality check and tests to confirm everything is clean:

```bash
bun run quality && bun run test
```

Expected: exits 0, all tests pass.

---

## Chunk 2: GitHub Actions release workflow

### File map

| Action | File                            |
| ------ | ------------------------------- |
| Create | `.github/workflows/release.yml` |

---

### Task 2.1: Create `.github/workflows/release.yml`

**Files:**

- Create: `.github/workflows/release.yml`

- [ ] Create `.github/workflows/release.yml` with the following content:

```yaml
name: Release

on:
  push:
    branches: ['master']

jobs:
  release:
    name: Build and Release
    runs-on: macos-latest
    timeout-minutes: 20

    permissions:
      contents: write

    steps:
      - name: Check out code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Compute version
        id: version
        run: |
          COMMIT_TS=$(git log -1 --pretty=%ct)
          SHA=$(git rev-parse --short HEAD)
          VERSION=$(date -u -r "$COMMIT_TS" "+%y.%m%d.%H%M")-$SHA
          echo "VERSION=$VERSION" >> "$GITHUB_OUTPUT"

      - name: Check if release already exists
        id: check_release
        run: |
          if gh release view "v${{ steps.version.outputs.VERSION }}" &>/dev/null; then
            echo "EXISTS=true" >> "$GITHUB_OUTPUT"
          else
            echo "EXISTS=false" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Build
        if: steps.check_release.outputs.EXISTS == 'false'
        run: bun run build
        env:
          BITBARD_INSTALL_BIN_DIR: ${{ env.HOME }}/.local/share/bitbard/bin

      - name: Compile standalone binary (darwin-arm64)
        if: steps.check_release.outputs.EXISTS == 'false'
        run: |
          bun build --compile \
            --target=bun-darwin-arm64 \
            packages/cli/dist/bitbard.js \
            --outfile bitbard

      - name: Package release assets
        if: steps.check_release.outputs.EXISTS == 'false'
        run: |
          tar -czf bitbard-darwin-arm64.tar.gz \
            bitbard \
            packages/cli/dist/bin/

      - name: Create GitHub Release
        if: steps.check_release.outputs.EXISTS == 'false'
        run: |
          gh release create "v${{ steps.version.outputs.VERSION }}" \
            bitbard-darwin-arm64.tar.gz \
            --title "v${{ steps.version.outputs.VERSION }}" \
            --notes "Automated release from master."
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Release already exists — skipping
        if: steps.check_release.outputs.EXISTS == 'true'
        run: echo "Release v${{ steps.version.outputs.VERSION }} already exists. Skipping."
```

Key points:

- `fetch-depth: 0` — full history required so `git log -1 --pretty=%ct` picks up the correct commit timestamp.
- `BITBARD_INSTALL_BIN_DIR` is set only for the `Build` step so the path is baked into the bundle before `bun build --compile` embeds it.
- The release check (`check_release`) gates all subsequent steps so re-runs are idempotent.
- `date -u -r "$COMMIT_TS"` is BSD `date` (macOS). Works because the runner is `macos-latest`.
- `contents: write` permission is required for `gh release create`.
- No quality or test steps — those are `ci.yml`'s responsibility (runs on PRs; master is protected).

- [ ] Verify the workflow file is valid YAML (no parse errors):

```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/release.yml'))" \
  && echo "YAML valid"
```

Expected: prints `YAML valid`.

---

## Chunk 3: Rewrite `install.sh`

### File map

| Action                | File         |
| --------------------- | ------------ |
| Modify (full rewrite) | `install.sh` |

---

### Task 3.1: Rewrite `install.sh`

**Files:**

- Modify: `install.sh`

The existing script (clone + build) is replaced wholesale. The new script downloads the pre-built tarball from GitHub Releases and installs it. No build tools required on the user's machine.

- [ ] Replace the entire contents of `install.sh` with:

```bash
#!/usr/bin/env bash

set -euo pipefail

{ # ensure the entire script is downloaded before execution

APP="bitbard"
GITHUB_REPO="geersch/bitbard-cli"
INSTALL_BIN_DIR="${HOME}/.local/bin"
INSTALL_DATA_DIR="${HOME}/.local/share/bitbard/bin"

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------

RED='\033[0;31m'
ORANGE='\033[38;5;214m'
MUTED='\033[0;2m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

bb_echo() {
  command printf '%s\n' "$*" 2>/dev/null
}

bb_error() {
  printf "${RED}Error: %s${NC}\n" "$*" >&2
  exit 1
}

bb_warn() {
  printf "${ORANGE}Warning: %s${NC}\n" "$*" >&2
}

usage() {
  cat <<EOF
bitbard installer

Usage: install.sh [options]

Options:
  -h, --help                 Show this help message
  -v, --version <version>    Install a specific version (e.g. 26.0507.1430-a3f2c1)
  --no-modify-path           Skip patching shell config files

Examples:
  curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/master/install.sh | bash
  curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/master/install.sh | bash -s -- --version 26.0507.1430-a3f2c1
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

requested_version="${VERSION:-}"
no_modify_path=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -v|--version)
      if [[ -n "${2:-}" ]]; then
        requested_version="$2"
        shift 2
      else
        bb_error "--version requires a version argument"
      fi
      ;;
    --no-modify-path)
      no_modify_path=true
      shift
      ;;
    *)
      bb_warn "Unknown option '$1'"
      shift
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Platform detection
# ---------------------------------------------------------------------------

raw_os=$(uname -s)
case "$raw_os" in
  Darwin*) os="darwin" ;;
  Linux*)  os="linux"  ;;
  *)       bb_error "Unsupported OS: ${raw_os}" ;;
esac

arch=$(uname -m)
case "$arch" in
  x86_64)  arch="x64"   ;;
  aarch64) arch="arm64" ;;
  arm64)   arch="arm64" ;;
  *)       bb_error "Unsupported architecture: ${arch}" ;;
esac

combo="${os}-${arch}"
case "$combo" in
  darwin-arm64) ;;
  *) bb_error "Unsupported platform: ${combo}. Only darwin-arm64 is supported in this release." ;;
esac

asset_name="${APP}-${combo}.tar.gz"

# ---------------------------------------------------------------------------
# Version resolution
# ---------------------------------------------------------------------------

if [[ -z "$requested_version" ]]; then
  bb_echo "=> Fetching latest release..."
  resolved_version=$(
    curl -sf "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" \
      | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p'
  )
  if [[ -z "$resolved_version" ]]; then
    bb_error "Failed to fetch latest release. Check https://github.com/${GITHUB_REPO}/releases"
  fi
else
  # Strip leading 'v' if present
  resolved_version="${requested_version#v}"
  http_status=$(
    curl -sI -o /dev/null -w "%{http_code}" \
      "https://github.com/${GITHUB_REPO}/releases/tag/v${resolved_version}"
  )
  if [[ "$http_status" == "404" ]]; then
    bb_error "Release v${resolved_version} not found. See https://github.com/${GITHUB_REPO}/releases"
  fi
fi

download_url="https://github.com/${GITHUB_REPO}/releases/download/v${resolved_version}/${asset_name}"

# ---------------------------------------------------------------------------
# Idempotency check
# ---------------------------------------------------------------------------

if command -v bitbard >/dev/null 2>&1; then
  installed_version=$(bitbard --version 2>/dev/null || true)
  if [[ "$installed_version" == "$resolved_version" ]]; then
    printf "${MUTED}bitbard %s is already installed.${NC}\n" "$resolved_version"
    exit 0
  fi
  printf "${MUTED}Updating bitbard from %s to %s...${NC}\n" "$installed_version" "$resolved_version"
else
  printf "${MUTED}Installing bitbard %s...${NC}\n" "$resolved_version"
fi

# ---------------------------------------------------------------------------
# Download with progress
# ---------------------------------------------------------------------------

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

archive="${tmp_dir}/${asset_name}"

if [[ -t 1 ]]; then
  curl -# -L -o "$archive" "$download_url"
else
  curl -sS -L -o "$archive" "$download_url"
fi

# ---------------------------------------------------------------------------
# Extract and install
# ---------------------------------------------------------------------------

bb_echo "=> Extracting..."
tar -xzf "$archive" -C "$tmp_dir"

# Install main binary
mkdir -p "$INSTALL_BIN_DIR"
mv "${tmp_dir}/${APP}" "${INSTALL_BIN_DIR}/${APP}"
chmod 755 "${INSTALL_BIN_DIR}/${APP}"
bb_echo "=> Installed ${APP} to ${INSTALL_BIN_DIR}/${APP}"

# Install Swift helpers (may not exist on all platforms / in all releases)
swift_bin_src="${tmp_dir}/packages/cli/dist/bin"
if [[ -d "$swift_bin_src" ]]; then
  mkdir -p "$INSTALL_DATA_DIR"
  cp -r "${swift_bin_src}/." "$INSTALL_DATA_DIR/"
  chmod 755 "${INSTALL_DATA_DIR}"/*
  bb_echo "=> Installed Swift helpers to ${INSTALL_DATA_DIR}"
fi

# ---------------------------------------------------------------------------
# PATH patching
# ---------------------------------------------------------------------------

add_to_path() {
  local config_file="$1"
  local line="$2"

  if grep -qF "$line" "$config_file" 2>/dev/null; then
    bb_echo "=> ${INSTALL_BIN_DIR} already in PATH in ${config_file}"
    return
  fi

  if [[ -w "$config_file" ]]; then
    printf '\n# Added by bitbard installer\n%s\n' "$line" >> "$config_file"
    bb_echo "=> Added ${INSTALL_BIN_DIR} to PATH in ${config_file}"
  else
    bb_warn "Cannot write to ${config_file}. Add manually:"
    bb_echo "   $line"
  fi
}

if [[ "$no_modify_path" != "true" ]]; then
  current_shell=$(basename "${SHELL:-bash}")

  case "$current_shell" in
    fish)
      config_file="${XDG_CONFIG_HOME:-${HOME}/.config}/fish/config.fish"
      path_line="fish_add_path ${INSTALL_BIN_DIR}"
      ;;
    zsh)
      config_file="${ZDOTDIR:-${HOME}}/.zshrc"
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
    bash)
      if [[ -f "${HOME}/.bashrc" ]]; then
        config_file="${HOME}/.bashrc"
      else
        config_file="${HOME}/.bash_profile"
      fi
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
    *)
      config_file="${HOME}/.profile"
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
  esac

  if [[ -f "$config_file" ]]; then
    if [[ ":${PATH}:" != *":${INSTALL_BIN_DIR}:"* ]]; then
      add_to_path "$config_file" "$path_line"
    else
      bb_echo "=> ${INSTALL_BIN_DIR} is already on PATH"
    fi
  else
    bb_warn "No shell config file found at ${config_file}. Add manually:"
    bb_echo "   $path_line"
  fi
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

bb_echo
bb_echo "=> bitbard ${resolved_version} installed successfully."
if [[ ":${PATH}:" != *":${INSTALL_BIN_DIR}:"* ]]; then
  bb_echo "=> Restart your shell or run:"
  bb_echo
  bb_echo "     export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
  bb_echo
fi
bb_echo "=> Then run: bitbard --help"

} # end of download guard
```

- [ ] Make the script executable:

```bash
chmod +x install.sh
```

- [ ] Run a basic syntax check with bash:

```bash
bash -n install.sh && echo "Syntax OK"
```

Expected: prints `Syntax OK`.

- [ ] Smoke-test the help flag:

```bash
bash install.sh --help
```

Expected: prints usage without errors.

- [ ] Smoke-test the unknown-option warning:

```bash
bash install.sh --bogus 2>&1 | grep -i warning
```

Expected: prints a warning line containing "Unknown option".

---

## Final checklist

- [ ] `bun run quality && bun run test` passes on the full monorepo
- [ ] `bash -n install.sh` reports no syntax errors
- [ ] `packages/cli/vite.config.ts` version string uses `-` not `+`
- [ ] `__BIN_DIR__` is declared in both `packages/cli/src/env.d.ts` and `packages/core/src/env.d.ts`
- [ ] All three callers (`alert.ts`, `flux.ts`, `truetone.ts`) use `__BIN_DIR__` with no remaining `fileURLToPath`/`import.meta.url` path derivation
- [ ] `.github/workflows/release.yml` exists and YAML is valid
- [ ] `install.sh` is executable and passes `bash -n`
