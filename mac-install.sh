#!/usr/bin/env bash

set -euo pipefail

red="$( (/usr/bin/tput bold || :; /usr/bin/tput setaf 1 || :) 2>&-)"
plain="$( (/usr/bin/tput sgr0 || :) 2>&-)"

status() { echo ">>> $*" >&2; }
error() { echo "${red}ERROR:${plain} $*"; exit 1; }
warning() { echo "${red}WARNING:${plain} $*"; }

# -------------------------------
# Version handling
# -------------------------------
RAW_VERSION="${1:-${NELA_VERSION:-latest}}"

if [ "$RAW_VERSION" = "latest" ]; then
    VERSION="latest"
else
    # Accept both "0.2.0" and "v0.2.0" from callers.
    VERSION="${RAW_VERSION#v}"
fi

status "Requested version: $RAW_VERSION"

# -------------------------------
# Temp setup
# -------------------------------
TEMP_DIR=$(mktemp -d)
MOUNT_POINT=''

cleanup() {
    if [ -n "$MOUNT_POINT" ] && mount | grep -q "on $MOUNT_POINT "; then
        hdiutil detach "$MOUNT_POINT" -quiet || true
    fi
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

# -------------------------------
# Helpers
# -------------------------------
available() { command -v "$1" >/dev/null; }

require() {
    local MISSING=''
    for TOOL in "$@"; do
        if ! available "$TOOL"; then
            MISSING="$MISSING $TOOL"
        fi
    done
    echo "$MISSING"
}

# -------------------------------
# OS / ARCH detection
# -------------------------------
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    aarch64|arm64) 
        if [ "$OS" = "Darwin" ]; then
            ARCH="aarch64"
        else
            ARCH="arm64"
        fi
        ;;
    *) error "Unsupported architecture: $ARCH" ;;
esac

# -------------------------------
# macOS install
# -------------------------------
if [ "$OS" = "Darwin" ]; then
    NEEDS=$(require curl hdiutil)
    if [ -n "$NEEDS" ]; then
        status "ERROR: Missing required tools:"
        for NEED in $NEEDS; do
            echo "  - $NEED"
        done
        exit 1
    fi

    # -------------------------------
    # Resolve download URL
    # -------------------------------
    BASE_URL="${NELA_BASE_URL:-__NELA_BASE_URL__}"
    BASE_URL="${BASE_URL%/}"
    status "Using API base: $BASE_URL"

    if [ "$VERSION" = "latest" ]; then
        status "Resolving latest version..."
        DOWNLOAD_URL="${BASE_URL}/api/latest/macOS/${ARCH}"
    else
        status "Resolving version $RAW_VERSION..."
        DOWNLOAD_URL="${BASE_URL}/api/version/${RAW_VERSION}/macOS/${ARCH}"
    fi

    status "Download URL: $DOWNLOAD_URL"

    DMG_PATH="$TEMP_DIR/NELA.dmg"
    MOUNT_POINT="$TEMP_DIR/NELA.mount"

    # -------------------------------
    # Stop running instance
    # -------------------------------
    if pgrep -x NELA >/dev/null 2>&1; then
        status "Stopping running NELA instance..."
        pkill -x NELA 2>/dev/null || true
        sleep 2
    fi

    # -------------------------------
    # Remove old install
    # -------------------------------
    if [ -d "/Applications/NELA.app" ]; then
        status "Removing existing NELA installation..."
        rm -rf "/Applications/NELA.app" 2>/dev/null || sudo rm -rf "/Applications/NELA.app"
    fi

    # -------------------------------
    # Download
    # -------------------------------
    status "Downloading NELA..."
    curl --fail --show-error --location --progress-bar \
        -o "$DMG_PATH" "$DOWNLOAD_URL"

    # -------------------------------
    # Mount DMG
    # -------------------------------
    status "Mounting DMG..."
    mkdir -p "$MOUNT_POINT"
    hdiutil attach "$DMG_PATH" -mountpoint "$MOUNT_POINT" -nobrowse -quiet

    if [ ! -d "$MOUNT_POINT/NELA.app" ]; then
        error "NELA.app not found inside DMG. Check DMG contents."
    fi

    # -------------------------------
    # Install
    # -------------------------------
    status "Installing NELA to /Applications..."
    cp -R "$MOUNT_POINT/NELA.app" "/Applications/" 2>/dev/null || \
        sudo cp -R "$MOUNT_POINT/NELA.app" "/Applications/"

    # -------------------------------
    # Unmount
    # -------------------------------
    status "Unmounting DMG..."
    hdiutil detach "$MOUNT_POINT" -quiet

    # -------------------------------
    # CLI setup
    # -------------------------------
    BIN_PATH="/Applications/NELA.app/Contents/MacOS/NELA"
    HAS_CLI=0

    if [ -f "$BIN_PATH" ]; then
        HAS_CLI=1
        if [ ! -L "/usr/local/bin/nela" ] || [ "$(readlink "/usr/local/bin/nela")" != "$BIN_PATH" ]; then
            status "Adding 'nela' command to PATH (may require password)..."
            mkdir -p "/usr/local/bin" 2>/dev/null || sudo mkdir -p "/usr/local/bin"
            ln -sf "$BIN_PATH" "/usr/local/bin/nela" 2>/dev/null || \
                sudo ln -sf "$BIN_PATH" "/usr/local/bin/nela"
        fi
    else
        warning "CLI binary not found at expected path: $BIN_PATH"
    fi

    # -------------------------------
    # Auto start
    # -------------------------------
    INSTALLED_VERSION=""
    if [ -f "/Applications/NELA.app/Contents/Info.plist" ]; then
        INSTALLED_VERSION=$(defaults read "/Applications/NELA.app/Contents/Info" CFBundleShortVersionString 2>/dev/null || true)
    fi

    if [ -n "$INSTALLED_VERSION" ]; then
        status "Installed app version: $INSTALLED_VERSION"
    fi

    if [ -z "${NELA_NO_START:-}" ]; then
        status "Starting NELA..."
        open -a NELA
    fi

    if [ "$HAS_CLI" -eq 1 ]; then
        status "Install complete. You can now run 'nela'."
    else
        status "Install complete. Launch NELA from Applications."
    fi
    exit 0
fi

error "Unsupported OS: $OS"