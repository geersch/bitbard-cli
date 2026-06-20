# Command Ideas

Ideas for new commands to add to bitbard. Existing groups: `audio`, `display`, `spotify`, `system`, `unifi`, `vpn`.

---

## New Commands in Existing Groups

### `audio`

- `audio input toggle` — Toggle mute/unmute on the default input device (mirrors `display flux` style toggle)
- `audio output toggle` — Toggle mute/unmute on the default output device
- `audio output volume-up` — Increase system output volume by a fixed step
- `audio output volume-down` — Decrease system output volume by a fixed step
- `audio output volume [n]` — Set output volume to an exact level (0–100)
- `audio output devices` — List all available output devices
- `audio input devices` — List all available input devices
- `audio output device [name]` — Switch the default output device (interactive selector if no arg)
- `audio input device [name]` — Switch the default input device (interactive selector if no arg)

### `display`

- `display brightness [n]` — Set screen brightness (0–100) via `brightness` CLI or CoreDisplay
- `display brightness up/down` — Nudge brightness by a fixed step
- `display resolution` — List available resolutions for each display and switch interactively
- `display nightshift` — Toggle Night Shift on/off
- `display mirroring` — Toggle display mirroring when multiple monitors are connected
- `display rotate [degrees]` — Rotate an external display (0, 90, 180, 270)
- `display screenshotformat [png|jpg|pdf]` — Change the default screenshot file format via `defaults`
- `display screenshottarget [path]` — Change the default screenshot save location

### `system`

- `system sleep` — Put the Mac to sleep immediately
- `system restart` — Prompt-confirmed system restart
- `system shutdown` — Prompt-confirmed system shutdown
- `system caffeinate` — Keep the Mac awake for a given duration (`--duration 2h`)
- `system clipboard` — Print the current clipboard contents to stdout
- `system clipboard clear` — Clear the clipboard
- `system dns flush` — Flush the DNS cache (`dscacheutil -flushcache`)
- `system wifi status` — Show current Wi-Fi network name and signal strength
- `system wifi on/off` — Enable or disable Wi-Fi
- `system wifi list` — List available Wi-Fi networks
- `system wifi connect [ssid]` — Connect to a Wi-Fi network (prompts for password)
- `system bluetooth on/off` — Enable or disable Bluetooth
- `system bluetooth devices` — List paired Bluetooth devices and their connection state
- `system battery` — Show battery percentage, charging state, and cycle count
- `system notifications on/off` — Enable or disable Do Not Disturb / Focus mode
- `system focus [mode]` — Activate a specific Focus mode (Work, Personal, Sleep, etc.)
- `system proxy` — Show current HTTP/HTTPS proxy settings
- `system timezone` — Show or set the system timezone
- `system uptime` — Print uptime and load average in a human-readable format
- `system trash empty` — Empty the Trash with a confirmation prompt
- `system defaults get/set` — Read or write macOS `defaults` keys without remembering the full command

### `spotify`

- `spotify shuffle on/off` — Enable or disable shuffle
- `spotify repeat [off|track|context]` — Set repeat mode
- `spotify seek [position]` — Seek to a position in the current track (seconds or mm:ss)
- `spotify volume [n]` — Set Spotify volume to an exact level (0–100)
- `spotify queue` — Show the upcoming tracks in the play queue
- `spotify add-to-queue [query]` — Search for a track and add it to the queue
- `spotify search [query]` — Search Spotify and open the result in the app

### `vpn`

- `vpn toggle` — Connect if disconnected, disconnect if connected
- `vpn status --watch` — Poll and stream VPN status changes to stdout until interrupted

### `unifi`

- `unifi devices list` — List all UniFi devices on the network (name, model, IP, status)
- `unifi clients list` — List connected clients (hostname, IP, MAC, SSID/port)
- `unifi chimes volume [id] [n]` — Set the volume on a specific chime
- `unifi doorbell snapshot [id]` — Download a snapshot from a UniFi Protect doorbell camera

---

## New Command Groups

### `git`

Quick-access shortcuts for common git workflows.

- `git branch cleanup` — Delete local branches that have been merged into main/master
- `git recent` — List recently checked-out branches
- `git undo` — Undo the last commit, keeping changes staged (`git reset --soft HEAD~1`)

### `app`

Manage macOS applications.

- `app launch [name]` — Launch an application by name
- `app quit [name]` — Quit an application by name
- `app list` — List all running applications
- `app kill [name]` — Force-quit an application

### `dock`

Control the macOS Dock without opening System Settings.

- `dock autohide on/off` — Toggle Dock auto-hide
- `dock position [left|bottom|right]` — Set Dock position
- `dock size [n]` — Set Dock icon size

### `finder`

- `finder hidden on/off` — Show or hide hidden files in Finder
- `finder extensions on/off` — Show or hide file extensions
- `finder open [path]` — Open a path in Finder (defaults to current directory)

### `network`

- `network ip` — Print local and public IP addresses
- `network ping [host]` — Ping a host and summarise packet loss / RTT
- `network speed` — Run a quick bandwidth test (upload + download)
- `network port [port]` — List processes listening on a port (PID, name, command) via `lsof`
- `network port kill [port]` — Kill the process listening on a port (with confirmation prompt)

### `clipboard`

A dedicated group for clipboard management.

- `clipboard` / `clipboard get` — Print clipboard contents
- `clipboard set [text]` — Write text to the clipboard
- `clipboard clear` — Clear the clipboard
- `clipboard history` — Show recent clipboard entries (requires a clipboard manager like Pasty)

### `notification`

- `notification send [title] [message]` — Post a macOS notification from the terminal
- `notification [--subtitle] [--sound]` — Optional flags for richer notifications

### `calendar`

- `calendar today` — List today's events from the default calendar
- `calendar next` — Show the next upcoming event
- `calendar week` — Show events for the current week

### `reminder`

- `reminder add [text]` — Add a reminder to the default Reminders list
- `reminder list` — List pending reminders

### `weather`

- `weather` — Print current weather and a short forecast for the current location (via wttr.in or a weather API)

### `timer`

- `timer [duration]` — Start a countdown timer; post a macOS notification when done (`timer 25m`)
- `timer stop` — Cancel the running timer

### `pwd` (power-user shortcuts)

Small ergonomic helpers that don't fit elsewhere.

- `open` — `open .` shorthand (open current directory in Finder)
- `ip` — Print local and public IP (shorthand for `network ip`)
- `version` — Print bitbard version (shorthand for `system info`)
