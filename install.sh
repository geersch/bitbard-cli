#!/usr/bin/env bash

{ # this ensures the entire script is downloaded before execution

BITBARD_GITHUB_REPO="geersch/bitbard-cli"
BITBARD_INSTALL_DIR="${BITBARD_DIR:-${HOME}/.bitbard}"
BITBARD_BIN_DIR="${HOME}/.local/bin"

bitbard_echo() {
  command printf '%s\n' "$*" 2>/dev/null
}

bitbard_has() {
  type "$1" > /dev/null 2>&1
}

bitbard_error() {
  bitbard_echo >&2 "Error: $*"
  exit 1
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------

check_prerequisites() {
  if ! bitbard_has git; then
    bitbard_error "git is required but was not found."
  fi

  if ! bitbard_has node; then
    bitbard_error "Node.js is required but was not found. Install it from https://nodejs.org and try again."
  fi
}

# ---------------------------------------------------------------------------
# Clone or update
# ---------------------------------------------------------------------------

install_or_update_repo() {
  if [ -d "${BITBARD_INSTALL_DIR}/.git" ]; then
    bitbard_echo "=> bitbard is already installed in ${BITBARD_INSTALL_DIR}, updating..."
    command git -C "${BITBARD_INSTALL_DIR}" fetch --depth=1 origin HEAD && \
      command git -C "${BITBARD_INSTALL_DIR}" reset --hard FETCH_HEAD || \
      bitbard_error "Failed to update the repository in ${BITBARD_INSTALL_DIR}."
  else
    bitbard_echo "=> Cloning bitbard into '${BITBARD_INSTALL_DIR}'..."
    mkdir -p "${BITBARD_INSTALL_DIR}" || bitbard_error "Failed to create directory '${BITBARD_INSTALL_DIR}'."
    command git clone --depth=1 "https://github.com/${BITBARD_GITHUB_REPO}.git" "${BITBARD_INSTALL_DIR}" || \
      bitbard_error "Failed to clone repository 'https://github.com/${BITBARD_GITHUB_REPO}.git'."
  fi
}

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

build() {
  local YARN="node ${BITBARD_INSTALL_DIR}/.yarn/releases/yarn-4.14.1.cjs"

  bitbard_echo "=> Installing dependencies..."
  ( cd "${BITBARD_INSTALL_DIR}" && ${YARN} install ) || \
    bitbard_error "Failed to install dependencies."

  bitbard_echo "=> Building bitbard..."
  ( cd "${BITBARD_INSTALL_DIR}" && ${YARN} build ) || \
    bitbard_error "Build failed."

  chmod +x "${BITBARD_INSTALL_DIR}/dist/bitbard.js"
}

# ---------------------------------------------------------------------------
# Link binary
# ---------------------------------------------------------------------------

link_binary() {
  mkdir -p "${BITBARD_BIN_DIR}"
  ln -sf "${BITBARD_INSTALL_DIR}/dist/bitbard.js" "${BITBARD_BIN_DIR}/bitbard"
  bitbard_echo "=> Linked bitbard binary to '${BITBARD_BIN_DIR}/bitbard'."
}

# ---------------------------------------------------------------------------
# Shell profile patching
# ---------------------------------------------------------------------------

bitbard_try_profile() {
  if [ -z "${1-}" ] || [ ! -f "${1}" ]; then
    return 1
  fi
  bitbard_echo "${1}"
}

bitbard_detect_profile() {
  local DETECTED_PROFILE=''

  if [ "${SHELL#*bash}" != "$SHELL" ]; then
    if [ -f "${HOME}/.bashrc" ]; then
      DETECTED_PROFILE="${HOME}/.bashrc"
    elif [ -f "${HOME}/.bash_profile" ]; then
      DETECTED_PROFILE="${HOME}/.bash_profile"
    fi
  elif [ "${SHELL#*zsh}" != "$SHELL" ]; then
    if [ -f "${ZDOTDIR:-${HOME}}/.zshrc" ]; then
      DETECTED_PROFILE="${ZDOTDIR:-${HOME}}/.zshrc"
    elif [ -f "${ZDOTDIR:-${HOME}}/.zprofile" ]; then
      DETECTED_PROFILE="${ZDOTDIR:-${HOME}}/.zprofile"
    fi
  fi

  if [ -z "$DETECTED_PROFILE" ]; then
    for EACH_PROFILE in ".profile" ".bashrc" ".bash_profile" ".zprofile" ".zshrc"; do
      if DETECTED_PROFILE="$(bitbard_try_profile "${ZDOTDIR:-${HOME}}/${EACH_PROFILE}")"; then
        break
      fi
    done
  fi

  bitbard_echo "${DETECTED_PROFILE}"
}

patch_shell_profile() {
  local PATH_LINE
  PATH_LINE="\\nexport PATH=\"\$HOME/.local/bin:\$PATH\" # Added by bitbard installer\\n"

  local PROFILE
  PROFILE="$(bitbard_detect_profile)"

  if [ -z "${PROFILE}" ]; then
    bitbard_echo "=> Could not detect a shell profile. Add the following line manually:"
    bitbard_echo "     export PATH=\"\$HOME/.local/bin:\$PATH\""
    return
  fi

  if command grep -qc '.local/bin' "${PROFILE}" 2>/dev/null; then
    bitbard_echo "=> \$HOME/.local/bin is already on PATH in ${PROFILE}."
  else
    bitbard_echo "=> Adding \$HOME/.local/bin to PATH in ${PROFILE}..."
    command printf '%b' "${PATH_LINE}" >> "${PROFILE}"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

bitbard_do_install() {
  bitbard_echo "=> Installing bitbard..."
  bitbard_echo

  check_prerequisites
  install_or_update_repo
  build
  link_binary
  patch_shell_profile

  bitbard_echo
  bitbard_echo "=> bitbard was installed successfully."
  bitbard_echo "=> Run the following to start using it (or open a new terminal):"
  bitbard_echo
  bitbard_echo "     export PATH=\"\$HOME/.local/bin:\$PATH\""
  bitbard_echo
  bitbard_echo "=> Then run: bitbard --help"
}

bitbard_do_install

} # this ensures the entire script is downloaded before execution
