# spotify

Control the Spotify application.

Most commands send instructions directly to the Spotify app on your Mac via AppleScript. The [speakers](#speakers) and [speaker](#speaker) commands use the [Spotify Web API](https://developer.spotify.com/documentation/web-api) and require a Spotify Developer account and a client ID — see [login](#login) for setup.

## Table of Contents

- [launch](#launch)
- [play](#play)
- [pause](#pause)
- [playpause](#playpause)
- [next](#next)
- [previous](#previous)
- [now](#now)
- [volume-up](#volume-up)
- [volume-down](#volume-down)
- [login](#login)
- [logout](#logout)
- [speakers](#speakers)
- [speaker](#speaker)

## launch

Launch Spotify or bring it to the foreground if it is already running.

```sh
bitbard spotify launch
```

## play

Play the currently selected track.

```sh
bitbard spotify play
```

## pause

Pause the currently playing track.

```sh
bitbard spotify pause
```

## playpause

Toggle play/pause.

```sh
bitbard spotify playpause
```

## next

Skip to the next track.

```sh
bitbard spotify next
```

## previous

Skip to the previous track.

```sh
bitbard spotify previous
```

## now

Display the currently playing artist, track, and album.

```sh
bitbard spotify now
```

## volume-up

Increase Spotify volume by 5.

```sh
bitbard spotify volume-up
```

## volume-down

Decrease Spotify volume by 5.

```sh
bitbard spotify volume-down
```

## login

Log in to Spotify via OAuth to enable Web API commands. Requires a client ID from a [Spotify Developer app](https://developer.spotify.com/dashboard).

```sh
bitbard spotify login --client-id <your-client-id>
```

**Options**

| Option        | Default      | Description                                |
| ------------- | ------------ | ------------------------------------------ |
| `--client-id` | _(required)_ | Your Spotify Developer app client ID       |
| `--port`      | `8888`       | Local port for the OAuth redirect callback |

This opens a browser window to complete the OAuth flow. Once authenticated, credentials are stored in the macOS Keychain and reused by subsequent commands. If you are already logged in, the command exits early with a reminder to run `logout` first if you want to switch accounts.

**Configuring redirect URIs in your Spotify app**

Add the redirect URI for each port you intend to use to the **Redirect URIs** list in your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) app settings. The [Spotify redirect URI docs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri) describe support for port-less loopback registration, but in practice the dashboard requires a port. Register the URI with the exact port you plan to use:

- Default: `http://127.0.0.1:8888/callback`
- Custom port example: `http://127.0.0.1:9999/callback`

> **Note:** `localhost` is not an accepted redirect URI — use `127.0.0.1` explicitly.

Use `--port` when the default port (`8888`) is already in use on your machine:

```sh
bitbard spotify login --client-id <your-client-id> --port 9999
```

## logout

Log out of Spotify, removing stored credentials.

```sh
bitbard spotify logout
```

## speakers

List available [Spotify Connect](https://www.spotify.com/connect/) devices.

```sh
bitbard spotify speakers
```

Devices are retrieved via the Spotify Web API and must be active (i.e. have Spotify open) to appear. Requires [login](#login).

> **Note:** Only devices that support Spotify Connect are listed. Some speaker types may not appear due to limitations of the Spotify Web API.

## speaker

Switch Spotify playback to a different device.

```sh
# Interactive — shows a prompt to pick a device
bitbard spotify speaker

# Direct — transfer to a specific device by ID
bitbard spotify speaker <device-id>
```

If no device ID is provided, an interactive prompt lists all available devices and their active state. Requires [login](#login).

> **Note:** Only devices that support Spotify Connect are listed. Some speaker types may not appear due to limitations of the Spotify Web API.
