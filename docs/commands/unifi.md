# unifi

Control UniFi Protect devices.

## Authentication

UniFi exposes two distinct APIs that require different credentials:

**Public API (API key)** — The official REST API, authenticated via an `X-API-KEY` header. Generate an API key in the UniFi console under your user profile.

**Local user account (private API)** — Some operations (e.g. triggering chime playback) are only available through the internal session-based API. This requires a local UniFi OS user account with the appropriate permissions. Setting up this account is your responsibility — bitbard will use it to obtain a session token and cache it in the keychain, refreshing it automatically when it expires.

All requests bypass TLS certificate validation to support self-signed certificates on local controllers.

## Setup

```sh
bitbard unifi login
```

Prompts for:

- **Host** — controller URL, e.g. `https://192.168.1.1`
- **API key** — for the public API
- **Username / Password** — local user account for the private API

Credentials are stored in the macOS Keychain under `bitbard-unifi`.

```sh
bitbard unifi logout
```

Removes all stored credentials.

## Commands

### `unifi chimes list`

List all UniFi Protect chimes.

```sh
bitbard unifi chimes list
```

Uses the public API (API key).

### `unifi chimes play-speaker [id]`

Trigger audio playback on a chime's speaker.

```sh
bitbard unifi chimes play-speaker [id] [--volume <n>] [--ringtone-id <id>]
```

| Argument / Flag | Description                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| `id`            | Chime ID. If omitted, an interactive prompt lets you pick from discovered chimes. |
| `--volume`      | Playback volume (integer). Defaults to `5`.                                       |
| `--ringtone-id` | Ringtone ID to play. Defaults to the API default if omitted.                      |

Uses the private API (local user session). Requires a local user account to be configured via `bitbard unifi login`.
