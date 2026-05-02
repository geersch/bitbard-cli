# bitbard

A general-purpose CLI tool. Currently supports PDF generation, with more commands coming.

## Table of Contents

- [Requirements](#requirements)
- [Installing and Updating](#installing-and-updating)
  - [Install Script](#install-script)
  - [Verify Installation](#verify-installation)
  - [Manual Install](#manual-install)
  - [Updating](#updating)
  - [Uninstalling](#uninstalling)
- [Commands](#commands)
  - [pdf convert](#pdf-convert)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)

## Requirements

- **git**
- **Node.js**

## Installing and Updating

### Install Script

To install or update bitbard, run the install script:

```sh
curl -o- https://raw.githubusercontent.com/geersch/bitbard-cli/master/install.sh | bash
```

The script will:

1. Check that `git` and `node` are available
2. Clone the repository into `~/.bitbard`
4. Install dependencies and build the project
5. Symlink the binary to `~/.local/bin/bitbard`
6. Add `~/.local/bin` to your `PATH` in your shell profile if not already present

> **Note:** Running the install script again on an existing installation will pull the latest changes and rebuild.

### Verify Installation

Open a new terminal (or reload your shell profile) and run:

```sh
bitbard --help
```

If you get `command not found`, make sure `~/.local/bin` is on your `PATH`:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

Add that line to your `~/.zshrc` or `~/.bashrc` to make it permanent.

### Manual Install

```sh
git clone https://github.com/geersch/bitbard-cli.git ~/.bitbard
cd ~/.bitbard
node .yarn/releases/yarn-4.14.1.cjs install
node .yarn/releases/yarn-4.14.1.cjs build
chmod +x dist/bitbard.js
ln -sf ~/.bitbard/dist/bitbard.js ~/.local/bin/bitbard
```

Then add `~/.local/bin` to your `PATH` as described above.

### Updating

Re-run the install script:

```sh
curl -o- https://raw.githubusercontent.com/geersch/bitbard-cli/master/install.sh | bash
```

Or manually:

```sh
cd ~/.bitbard
git fetch --depth=1 origin HEAD
git reset --hard FETCH_HEAD
node .yarn/releases/yarn-4.14.1.cjs install
node .yarn/releases/yarn-4.14.1.cjs build
```

### Uninstalling

```sh
rm ~/.local/bin/bitbard
rm -rf ~/.bitbard
```

Then remove the `PATH` export line the installer added to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.).

## Commands

### pdf convert

Convert plain text or markdown to a PDF file.

```
bitbard pdf convert <output.pdf> [options]
```

| Argument | Description |
|---|---|
| `<output.pdf>` | Path to the output PDF file (required, must end in `.pdf`) |
| `--text`, `-t` | Inline text to convert |
| `--markdown`, `-m` | Treat inline `--text` as markdown (ignored when `--file` is used) |
| `--file`, `-f` | Path to a `.txt` or `.md` file to convert |

`--text` and `--file` are mutually exclusive. You must provide exactly one.

When using `--file`, the format is detected automatically from the file extension (`.txt` for plain text, `.md` for markdown).

**Convert inline text:**

```sh
bitbard pdf convert output.pdf --text "Hello, world!"
```

**Convert inline markdown:**

```sh
bitbard pdf convert output.pdf --text "# Title\n**bold** and _italic_" --markdown
```

**Convert a text file:**

```sh
bitbard pdf convert output.pdf --file document.txt
```

**Convert a markdown file:**

```sh
bitbard pdf convert output.pdf --file document.md
```

## Environment Variables

| Variable | Description |
|---|---|
| `BITBARD_DIR` | Override the install directory (default: `~/.bitbard`) |
