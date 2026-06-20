# bitbard

A general-purpose CLI tool. Currently supports audio controls, display controls, VPN management, and more.

## Table of Contents

- [Installing and Upgrading](#installing-and-upgrading)
  - [Install Script](#install-script)
  - [Verify Installation](#verify-installation)
  - [Upgrading](#upgrading)
  - [Uninstalling](#uninstalling)
- [Commands](#commands)
  - [audio](docs/commands/audio.md)
  - [display](docs/commands/display.md)
  - [spotify](docs/commands/spotify.md)
  - [system](docs/commands/system.md)
  - [unifi](docs/commands/unifi.md)
  - [vpn](docs/commands/vpn.md)
- [Ideas](docs/ideas.md)

## Installing and Upgrading

### Install Script

To install or update bitbard, run the install script:

```sh
curl -fsSL https://raw.githubusercontent.com/geersch/bitbard-cli/master/install.sh | bash
```

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

### Upgrading

Use the built-in upgrade command:

```sh
bitbard upgrade
```

Or re-run the install script:

```sh
curl -fsSL https://raw.githubusercontent.com/geersch/bitbard-cli/master/install.sh | bash
```

### Uninstalling

Run these commands to fully remove bitbard:

```sh
# Stop and remove the background daemon
launchctl unload ~/Library/LaunchAgents/com.bitbard.bitbardd.plist
rm ~/Library/LaunchAgents/com.bitbard.bitbardd.plist

# Remove installed binaries
rm ~/.local/share/bitbard/bin/bitbardd
rm ~/.local/bin/bitbard

# Optional: remove config and state
rm -rf ~/.config/bitbard
```

Then remove the `export PATH` line added by the installer from your shell config file (e.g. `~/.zshrc`).

## Commands

| Command                             | Description                     |
| ----------------------------------- | ------------------------------- |
| [audio](docs/commands/audio.md)     | Audio device commands           |
| [display](docs/commands/display.md) | Display-related commands        |
| [spotify](docs/commands/spotify.md) | Control the Spotify application |
| [system](docs/commands/system.md)   | System-related commands         |
| [unifi](docs/commands/unifi.md)     | Control UniFi devices           |
| [vpn](docs/commands/vpn.md)         | VPN management commands         |

## Ideas

Potential new commands and features are tracked in [docs/ideas.md](docs/ideas.md).
