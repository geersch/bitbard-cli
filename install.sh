#!/usr/bin/env bash

set -euo pipefail

{ # ensure the entire script is downloaded before execution

APP="bitbard"
GITHUB_REPO="geersch/bitbard-cli"
INSTALL_BIN_DIR="${HOME}/.local/bin"
INSTALL_DATA_DIR="${HOME}/.local/share/bitbard/bin"

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------

RED='\033[0;31m'
ORANGE='\033[38;5;214m'
MUTED='\033[0;2m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

bb_echo() {
  command printf '%s\n' "$*" 2>/dev/null
}

bb_error() {
  printf "${RED}Error: %s${NC}\n" "$*" >&2
  exit 1
}

bb_warn() {
  printf "${ORANGE}Warning: %s${NC}\n" "$*" >&2
}

bb_install_launchagent() {
  local plist_dir="${HOME}/Library/LaunchAgents"
  local plist_path="${plist_dir}/com.bitbard.bitbardd.plist"
  local daemon_bin="${INSTALL_DATA_DIR}/bitbardd"

  mkdir -p "$plist_dir"

  # Unload existing agent before replacing it
  if [[ -f "$plist_path" ]]; then
    launchctl unload "$plist_path" 2>/dev/null || true
  fi

  cat > "$plist_path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.bitbard.bitbardd</string>
  <key>ProgramArguments</key>
  <array>
    <string>${daemon_bin}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/bitbardd.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/bitbardd.log</string>
</dict>
</plist>
PLIST

  if launchctl load "$plist_path" 2>/dev/null; then
    bb_echo "=> bitbardd LaunchAgent installed and started"
  else
    bb_warn "launchctl load failed. Start manually: launchctl load ${plist_path}"
  fi
}

usage() {
  cat <<EOF
bitbard installer

Usage: install.sh [options]

Options:
  -h, --help                 Show this help message
  -v, --version <version>    Install a specific version (e.g. 26.0507.1430-a3f2c1)
  --no-modify-path           Skip patching shell config files

Examples:
  curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/master/install.sh | bash
  curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPO}/master/install.sh | bash -s -- --version 26.0507.1430-a3f2c1
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

requested_version="${VERSION:-}"
no_modify_path=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -v|--version)
      if [[ -n "${2:-}" ]]; then
        requested_version="$2"
        shift 2
      else
        bb_error "--version requires a version argument"
      fi
      ;;
    --no-modify-path)
      no_modify_path=true
      shift
      ;;
    *)
      bb_warn "Unknown option '$1'"
      shift
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Platform detection
# ---------------------------------------------------------------------------

raw_os=$(uname -s)
case "$raw_os" in
  Darwin*) os="darwin" ;;
  *)       bb_error "Unsupported OS: ${raw_os}" ;;
esac

arch=$(uname -m)
case "$arch" in
  x86_64)  arch="x64"   ;;
  aarch64) arch="arm64" ;;
  arm64)   arch="arm64" ;;
  *)       bb_error "Unsupported architecture: ${arch}" ;;
esac

combo="${os}-${arch}"
case "$combo" in
  darwin-arm64) ;;
  *) bb_error "Unsupported platform: ${combo}. Only darwin-arm64 is supported in this release." ;;
esac

asset_name="${APP}-${combo}.tar.gz"

bb_echo "Detected platform: ${combo}"

# ---------------------------------------------------------------------------
# Version resolution
# ---------------------------------------------------------------------------

if [[ -n "$requested_version" ]]; then
  resolved_version="${requested_version#v}"
else
  bb_echo "=> Fetching latest release..."
  api_url="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
  api_http_status=$(curl -s -o /dev/null -w "%{http_code}" "$api_url")

  if [[ "$api_http_status" == "404" ]]; then
    bb_error "No releases found for ${GITHUB_REPO}. Check https://github.com/${GITHUB_REPO}/releases"
  elif [[ "$api_http_status" != "200" ]]; then
    bb_error "Failed to fetch latest release (HTTP ${api_http_status}). Check https://github.com/${GITHUB_REPO}/releases"
  fi

  resolved_version=$(curl -sf "$api_url" | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')
  if [[ -z "$resolved_version" ]]; then
    bb_error "Could not parse release version from API response. Check https://github.com/${GITHUB_REPO}/releases"
  fi
fi

download_url="https://github.com/${GITHUB_REPO}/releases/download/v${resolved_version}/${asset_name}"

# ---------------------------------------------------------------------------
# Idempotency check
# ---------------------------------------------------------------------------

if command -v bitbard >/dev/null 2>&1; then
  installed_version=$(bitbard --version 2>/dev/null || true)
  if [[ "$installed_version" == "$resolved_version" ]]; then
    printf "${MUTED}bitbard %s is already installed.${NC}\n" "$resolved_version"
    exit 0
  fi
  printf "${MUTED}Updating bitbard from %s to %s...${NC}\n" "$installed_version" "$resolved_version"
else
  printf "${MUTED}Installing bitbard %s...${NC}\n" "$resolved_version"
fi

# ---------------------------------------------------------------------------
# Download with progress
# ---------------------------------------------------------------------------

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

archive="${tmp_dir}/${asset_name}"

if [[ -t 1 ]]; then
  curl -# -L -o "$archive" "$download_url"
else
  curl -sS -L -o "$archive" "$download_url"
fi

# ---------------------------------------------------------------------------
# Extract and install
# ---------------------------------------------------------------------------

bb_echo "=> Extracting..."
tar -xzf "$archive" -C "$tmp_dir"

# Install main binary
mkdir -p "$INSTALL_BIN_DIR"
mv "${tmp_dir}/${APP}" "${INSTALL_BIN_DIR}/${APP}"
chmod 755 "${INSTALL_BIN_DIR}/${APP}"
bb_echo "=> Installed ${APP} to ${INSTALL_BIN_DIR}/${APP}"

# Install bitbardd daemon (may not exist on all platforms / in all releases)
if [[ -f "${tmp_dir}/bitbardd" ]]; then
  mkdir -p "$INSTALL_DATA_DIR"
  cp "${tmp_dir}/bitbardd" "${INSTALL_DATA_DIR}/bitbardd"
  chmod 755 "${INSTALL_DATA_DIR}/bitbardd"
  bb_echo "=> Installed bitbardd to ${INSTALL_DATA_DIR}"
  bb_install_launchagent
fi

# ---------------------------------------------------------------------------
# PATH patching
# ---------------------------------------------------------------------------

add_to_path() {
  local config_file="$1"
  local line="$2"

  if grep -qF "$line" "$config_file" 2>/dev/null; then
    bb_echo "=> ${INSTALL_BIN_DIR} already in PATH in ${config_file}"
    return
  fi

  if [[ -w "$config_file" ]]; then
    printf '\n# Added by bitbard installer\n%s\n' "$line" >> "$config_file"
    bb_echo "=> Added ${INSTALL_BIN_DIR} to PATH in ${config_file}"
  else
    bb_warn "Cannot write to ${config_file}. Add manually:"
    bb_echo "   $line"
  fi
}

if [[ "$no_modify_path" != "true" ]]; then
  current_shell=$(basename "${SHELL:-bash}")

  case "$current_shell" in
    fish)
      config_file="${XDG_CONFIG_HOME:-${HOME}/.config}/fish/config.fish"
      path_line="fish_add_path ${INSTALL_BIN_DIR}"
      ;;
    zsh)
      config_file="${ZDOTDIR:-${HOME}}/.zshrc"
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
    bash)
      if [[ -f "${HOME}/.bashrc" ]]; then
        config_file="${HOME}/.bashrc"
      else
        config_file="${HOME}/.bash_profile"
      fi
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
    *)
      config_file="${HOME}/.profile"
      path_line="export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
      ;;
  esac

  if [[ -f "$config_file" ]]; then
    if [[ ":${PATH}:" != *":${INSTALL_BIN_DIR}:"* ]]; then
      add_to_path "$config_file" "$path_line"
    else
      bb_echo "=> ${INSTALL_BIN_DIR} is already on PATH"
    fi
  else
    bb_warn "No shell config file found at ${config_file}. Add manually:"
    bb_echo "   $path_line"
  fi
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

bb_echo
bb_echo "=> bitbard ${resolved_version} installed successfully."
if [[ ":${PATH}:" != *":${INSTALL_BIN_DIR}:"* ]]; then
  bb_echo "=> Restart your shell or run:"
  bb_echo
  bb_echo "     export PATH=\"${INSTALL_BIN_DIR}:\$PATH\""
  bb_echo
fi
bb_echo "=> Then run: bitbard --help"

} # end of download guard