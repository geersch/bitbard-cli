# vpn

VPN management commands.

## Table of Contents

- [connect](#connect)
- [disconnect](#disconnect)
- [list](#list)
- [status](#status)

## connect

Connect to a VPN configuration.

```sh
bitbard vpn connect
```

If only one VPN configuration exists, it connects automatically. If multiple configurations are present, an interactive prompt is shown to select one.

## disconnect

Disconnect the active VPN connection.

```sh
bitbard vpn disconnect
```

Finds the currently connected (or connecting) VPN and stops it. Logs a message if no active connection is found.

## list

List all VPN configurations and their current status.

```sh
bitbard vpn list
```

## status

Show the current VPN connection status.

```sh
bitbard vpn status
```
