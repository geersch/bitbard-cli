# display

Display-related commands.

## Table of Contents

- [darkmode](#darkmode)
- [flux](#flux)
- [truetone](#truetone)

## darkmode

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

## flux

Toggle a warm screen tint similar to [f.lux](https://justgetflux.com/). Reduces blue light by applying a warm gamma table to all active displays.

```sh
bitbard display flux
```

Each invocation toggles the tint on or off. State is held in memory by the bitbardd daemon.

> **Note:** Requires permission to control display gamma (no additional entitlements needed beyond running as the current user).

## truetone

Toggle the macOS True Tone setting.

```sh
bitbard display truetone
```
