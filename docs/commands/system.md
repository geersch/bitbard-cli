# system

System-related commands.

## Table of Contents

- [info](#info)
- [lock](#lock)
- [screensaver](#screensaver)

## info

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

## lock

Lock the screen.

```sh
bitbard system lock
```

> **Note:** Uses Apple's private API. This may stop working in a future macOS release without warning.

## screensaver

Start the screensaver.

```sh
bitbard system screensaver
```
