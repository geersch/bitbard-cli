# bitbard

A general-purpose CLI tool. Currently supports display controls, VPN management, and more.

## Table of Contents

- [Installing and Upgrading](#installing-and-upgrading)
  - [Install Script](#install-script)
  - [Verify Installation](#verify-installation)
  - [Upgrading](#upgrading)
  - [Uninstalling](#uninstalling)
- [Commands](#commands)
  - [system](#system)
    - [info](#info)
  - [upgrade](#upgrade)
  - [display](#display)
    - [darkmode](#darkmode)
    - [flux](#flux)
    - [truetone](#truetone)
  - [vpn](#vpn)
    - [connect](#connect)
    - [disconnect](#disconnect)
    - [list](#list)
    - [status](#status)

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

```sh
rm ~/.local/bin/bitbard
rm -rf ~/.local/share/bitbard
rm -rf ~/.config/bitbard
```

Then remove the `# Added by bitbard installer` block from your shell profile (`~/.zshrc`, `~/.bashrc`, etc.).

## Commands

### system

System-related commands.

#### info

Print system information for bug reports.

```sh
bitbard system info
```

Displays the bitbard version, OS, architecture, CPU, memory, Node.js, Git, and shell details.

```
bitbard system info

  bitbard:          1.0.0
  OS:               macOS 15.4.1
  Architecture:     arm64
  CPUs:             Apple M4 Pro (14 cores)
  Memory:           48.00 GB
  Node:             24.11.1
  Git:              2.48.0
  Shell:            /bin/zsh (zsh 5.9 (arm64-apple-darwin25.0))
```

### upgrade

Upgrade bitbard CLI to the latest version.

```sh
bitbard upgrade
```

Pulls the latest changes from GitHub, reinstalls dependencies, and rebuilds the binary in place. Requires the installation to have been set up via the install script or manual install (a git repository must exist at `~/.bitbard`).

### display

Display-related commands.

#### darkmode

Switch macOS appearance between Light and Dark mode.

```sh
bitbard display darkmode
```

Presents an interactive prompt to select the desired appearance mode:

```
◆  Select appearance mode
│  ○ Light
│  ● Dark
└
```

> **Note:** macOS only.

#### flux

Toggle a warm screen tint similar to [f.lux](https://justgetflux.com/). Reduces blue light by applying a warm gamma table to all active displays.

```sh
bitbard display flux
```

Each invocation toggles the tint on or off. State is persisted in `~/.config/bitbard/flux.json`.

> **Note:** macOS only. Requires permission to control display gamma (no additional entitlements needed beyond running as the current user).

#### truetone

Toggle the macOS True Tone setting.

```sh
bitbard display truetone
```

### vpn

VPN management commands.

> **Note:** macOS only.

#### connect

Connect to a VPN configuration.

```sh
bitbard vpn connect
```

If only one VPN configuration exists, it connects automatically. If multiple configurations are present, an interactive prompt is shown to select one.

#### disconnect

Disconnect the active VPN connection.

```sh
bitbard vpn disconnect
```

Finds the currently connected (or connecting) VPN and stops it. Logs a message if no active connection is found.

#### status

Show the current VPN connection status.

```sh
bitbard vpn status
```

#### list

List all VPN configurations and their current status.

```sh
bitbard vpn list
```
