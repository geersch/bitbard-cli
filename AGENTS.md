# bitbard AI Agent Guide

This document provides guidance for AI agents working on the bitbard codebase.

## Project Overview

bitbard is a macOS CLI for everyday tasks.

- **Language**: TypeScript (ESM-first)
- **Package Manager**: Bun (required)
- **Node Version**: ^24.0.0 || >=26.0.0
- **Build System**: Rolldown + Swift Compiler
- **Monorepo**: Bun workspaces + Turborepo
- **CLI Framework**: citty
- **Platform**: macOS only (darwin-arm64)

## Setup

```sh
bun install --frozen-lockfile
bun run build
```

The build bundles `packages/cli/src/bitbard.ts` via rolldown into `packages/cli/dist/bitbard.js`, and compiles Swift helper binaries (alert, flux, lock, truetone) under `packages/cli/dist/bin/`.

## Key Scripts

| Script                | Description                               |
| --------------------- | ----------------------------------------- |
| `bun run build`       | Build all packages                        |
| `bun run test`        | Run all tests                             |
| `bun run check-types` | TypeScript type checking (`tsc --noEmit`) |
| `bun run lint`        | Run oxlint                                |
| `bun run lint:fix`    | Auto-fix lint issues                      |
| `bun run format`      | Check formatting with oxfmt               |
| `bun run format:fix`  | Auto-fix formatting                       |
| `bun run quality`     | Run lint + format checks                  |
| `bun run quality:fix` | Auto-fix lint and formatting              |

## Testing

Tests use Vitest with `globals: true` in a `node` environment. Test files are co-located with source files.

```sh
# Run all tests
bun run test

# Run tests in a specific package
bun run test  # from packages/core/ or packages/cli/
```

Always run tests after making changes. Run `bun run check-types` to verify types.

## Project Structure

### Packages

- `packages/cli` (`@bitbard/cli`) — CLI entry point and commands
- `packages/core` (`@bitbard/core`) — shared utilities and Swift helper sources
- `packages/typescript-config` — shared tsconfig base

### Important Directories

- `packages/cli/src/commands/` — one subdirectory per command group (display, system, spotify, vpn)
- `packages/cli/src/plugins/` — citty plugins (e.g. macOS platform guard)
- `packages/core/src/swift/` — Swift source files compiled into native helpers during build
- `.github/` — GitHub Actions workflows

## Code Style and Conventions

### Formatting and Linting

- **Always run** `bun run quality:fix` after making changes
- Manually fix non-auto-fixable errors.

### TypeScript

- Run `bun run check-types` to verify types
- Configuration files: `packages/typescript-config/base.json`

### Code Quality

- Follow existing patterns in the codebase
- Do not add comments explaining what a line does unless asked
- macOS-only commands must use the `macosPlugin` citty plugin

## Adding New Commands

1. Create a new file in the appropriate `packages/cli/src/commands/<group>/` directory
2. Register the command in the parent group's `index.ts` (or create one if needed)
3. Put shared logic in `packages/core/src/`
4. Use the `macosPlugin` for any command that requires macOS
5. Add tests co-located with the source file (`.spec.ts`)
6. Run `bun run build && bun run check-types && bun run quality:fix && bun run test`
