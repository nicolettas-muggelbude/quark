#!/bin/bash
# Quark – Desktop-Integration für Linux
# Erstellt einen Starter in GNOME, KDE, XFCE und anderen Desktop-Umgebungen.
# Prüft und repariert automatisch fehlende Systemabhängigkeiten.
# Benötigt KEIN sudo für die Integration – nur optional für die Reparatur.
#
# Verwendung:
#   chmod +x install-linux.sh
#   ./install-linux.sh /pfad/zu/Quark_amd64.AppImage
#
# Ohne Argument wird ~/Downloads/Quark*.AppImage gesucht.

set -e

# ── AppImage finden ────────────────────────────────────────────────────────────
APPIMAGE="${1:-}"
if [ -z "$APPIMAGE" ]; then
  APPIMAGE="$(ls -t "$HOME/Downloads/Quark"*.AppImage 2>/dev/null | head -1)"
fi
if [ -z "$APPIMAGE" ] || [ ! -f "$APPIMAGE" ]; then
  echo "Fehler: AppImage nicht gefunden."
  echo "Verwendung: $0 /pfad/zu/Quark_amd64.AppImage"
  exit 1
fi
APPIMAGE="$(realpath "$APPIMAGE")"
echo "AppImage: $APPIMAGE"

# ── AppImage in stabilen Pfad installieren ─────────────────────────────────────
INSTALL_DIR="$HOME/.local/bin"
APPIMAGE_INSTALLED="$INSTALL_DIR/Quark.AppImage"
mkdir -p "$INSTALL_DIR"
cp -f "$APPIMAGE" "$APPIMAGE_INSTALLED"
chmod +x "$APPIMAGE_INSTALLED"
echo "AppImage installiert nach: $APPIMAGE_INSTALLED"
APPIMAGE_ORIGINAL="$APPIMAGE"
APPIMAGE="$APPIMAGE_INSTALLED"

# ── Systemabhängigkeiten prüfen und ggf. reparieren ───────────────────────────
check_and_fix_deps() {
  local pkg_manager="" webkit_pkg="" egl_pkg="" fuse_pkg="" extra_pkgs=""

  if command -v apt &>/dev/null; then
    pkg_manager="apt"
    webkit_pkg="libwebkit2gtk-4.1-0"
    egl_pkg="libegl1"
    extra_pkgs="libgl1-mesa-dri"
    # FUSE 2: Paketname je nach Ubuntu/Debian-Version
    if apt-cache show libfuse2t64 &>/dev/null 2>&1; then
      fuse_pkg="libfuse2t64"
    elif apt-cache show libfuse2to64 &>/dev/null 2>&1; then
      fuse_pkg="libfuse2to64"
    else
      fuse_pkg="libfuse2"
    fi
  elif command -v dnf &>/dev/null; then
    pkg_manager="dnf"
    webkit_pkg="webkit2gtk4.1"
    egl_pkg="mesa-libEGL"
    extra_pkgs="mesa-dri-drivers"
    fuse_pkg="fuse-libs"
  elif command -v zypper &>/dev/null; then
    pkg_manager="zypper"
    webkit_pkg="libwebkit2gtk-4.1-0"
    egl_pkg="libEGL1"
    extra_pkgs=""
    fuse_pkg="libfuse2"
  elif command -v pacman &>/dev/null; then
    pkg_manager="pacman"
    webkit_pkg="webkit2gtk-4.1"
    egl_pkg=""
    extra_pkgs=""
    fuse_pkg="fuse2"
  fi

  local webkit_ok=true egl_ok=true fuse_ok=true

  if [ "$pkg_manager" = "apt" ]; then
    dpkg -s "$webkit_pkg" &>/dev/null || webkit_ok=false
  elif [ "$pkg_manager" = "dnf" ] || [ "$pkg_manager" = "zypper" ]; then
    rpm -q "$webkit_pkg" &>/dev/null || webkit_ok=false
  elif [ "$pkg_manager" = "pacman" ]; then
    pacman -Q "$webkit_pkg" &>/dev/null || webkit_ok=false
  fi

  ldconfig -p 2>/dev/null | grep -q "libEGL\.so\.1" || egl_ok=false

  # FUSE 2 prüfen (AppImage-Voraussetzung)
  ldconfig -p 2>/dev/null | grep -q "libfuse\.so\.2" || fuse_ok=false

  echo ""
  echo "── Systemprüfung ──────────────────────────────────────────────────────"

  if $webkit_ok; then
    echo "  ✓ $webkit_pkg installiert"
  else
    echo "  ✗ $webkit_pkg fehlt  ← Ursache für weißes Fenster"
  fi

  if $egl_ok; then
    echo "  ✓ libEGL vorhanden"
  else
    echo "  ✗ libEGL fehlt  ← Ursache für weißes Fenster"
  fi

  if $fuse_ok; then
    echo "  ✓ libfuse2 vorhanden"
  else
    echo "  ✗ libfuse2 fehlt  ← AppImage startet nicht ohne FUSE 2"
  fi

  echo "────────────────────────────────────────────────────────────────────────"

  if $webkit_ok && $egl_ok && $fuse_ok; then
    echo "  ✓ Alle Abhängigkeiten in Ordnung."
    echo ""
    echo "  Hinweis: Falls Quark trotzdem ein weißes Fenster zeigt,"
    echo "  kann ein Defekt in einer Systembibliothek die Ursache sein."
    echo "  Reparatur-Option: $0 --repair $APPIMAGE"
    return 0
  fi

  echo ""
  echo "  ⚠  Fehlende Abhängigkeiten erkannt."
  if ! $fuse_ok; then
    echo "     libfuse2 fehlt → AppImage startet nicht."
  fi
  if ! $webkit_ok || ! $egl_ok; then
    echo "     Quark wird wahrscheinlich ein weißes Fenster zeigen."
  fi
  echo ""

  if [ -z "$pkg_manager" ]; then
    echo "  Kein bekannter Paketmanager gefunden."
    echo "  Bitte webkit2gtk 4.1 und libfuse2 für deine Distribution manuell installieren."
    echo ""
    return 0
  fi

  _install_deps "$pkg_manager" "$webkit_pkg" "$egl_pkg" "$fuse_pkg" "$extra_pkgs"
}

# ── Reparatur-Modus: Pakete neu installieren (auch wenn vorhanden) ─────────────
repair_deps() {
  local pkg_manager="" webkit_pkg="" egl_pkg="" fuse_pkg="" extra_pkgs=""

  if command -v apt &>/dev/null; then
    pkg_manager="apt"; webkit_pkg="libwebkit2gtk-4.1-0"
    egl_pkg="libegl1"; extra_pkgs="libgl1-mesa-dri"
    if apt-cache show libfuse2t64 &>/dev/null 2>&1; then
      fuse_pkg="libfuse2t64"
    elif apt-cache show libfuse2to64 &>/dev/null 2>&1; then
      fuse_pkg="libfuse2to64"
    else
      fuse_pkg="libfuse2"
    fi
  elif command -v dnf &>/dev/null; then
    pkg_manager="dnf"; webkit_pkg="webkit2gtk4.1"
    egl_pkg="mesa-libEGL"; extra_pkgs="mesa-dri-drivers"; fuse_pkg="fuse-libs"
  elif command -v zypper &>/dev/null; then
    pkg_manager="zypper"; webkit_pkg="libwebkit2gtk-4.1-0"
    egl_pkg="libEGL1"; extra_pkgs=""; fuse_pkg="libfuse2"
  elif command -v pacman &>/dev/null; then
    pkg_manager="pacman"; webkit_pkg="webkit2gtk-4.1"
    egl_pkg=""; extra_pkgs=""; fuse_pkg="fuse2"
  else
    echo "Kein bekannter Paketmanager gefunden."
    exit 1
  fi

  echo ""
  echo "── Reparatur-Modus ────────────────────────────────────────────────────"
  echo "  Installiert Systembibliotheken neu (behebt weiße Fenster)."
  echo "────────────────────────────────────────────────────────────────────────"
  echo ""

  _install_deps "$pkg_manager" "$webkit_pkg" "$egl_pkg" "$fuse_pkg" "$extra_pkgs" "reinstall"
}

_install_deps() {
  local pkg_manager="$1" webkit_pkg="$2" egl_pkg="$3" fuse_pkg="$4" extra_pkgs="$5"
  local mode="${6:-install}"

  local cmd_label="Installieren"
  [ "$mode" = "reinstall" ] && cmd_label="Neu installieren"

  local pkgs="$webkit_pkg"
  [ -n "$egl_pkg" ]    && pkgs="$pkgs $egl_pkg"
  [ -n "$fuse_pkg" ]   && pkgs="$pkgs $fuse_pkg"
  [ -n "$extra_pkgs" ] && pkgs="$pkgs $extra_pkgs"

  echo "  $cmd_label mit sudo (Passwort erforderlich):"
  if [ "$pkg_manager" = "apt" ]; then
    if [ "$mode" = "reinstall" ]; then
      echo "    sudo apt install --reinstall $pkgs"
    else
      echo "    sudo apt install $pkgs"
    fi
  elif [ "$pkg_manager" = "dnf" ]; then
    if [ "$mode" = "reinstall" ]; then
      echo "    sudo dnf reinstall $pkgs"
    else
      echo "    sudo dnf install $pkgs"
    fi
  elif [ "$pkg_manager" = "zypper" ]; then
    echo "    sudo zypper install $pkgs"
  elif [ "$pkg_manager" = "pacman" ]; then
    echo "    sudo pacman -S $pkgs"
  fi
  echo ""
  printf "  Jetzt automatisch ausführen? [J/n] "
  read -r answer
  answer="${answer:-j}"

  if [[ "$answer" =~ ^[jJyY]$ ]]; then
    if [ "$pkg_manager" = "apt" ]; then
      if [ "$mode" = "reinstall" ]; then
        sudo apt install --reinstall -y $pkgs
      else
        sudo apt install -y $pkgs
      fi
    elif [ "$pkg_manager" = "dnf" ]; then
      if [ "$mode" = "reinstall" ]; then
        sudo dnf reinstall -y $pkgs 2>/dev/null || sudo dnf install -y $pkgs
      else
        sudo dnf install -y $pkgs
      fi
    elif [ "$pkg_manager" = "zypper" ]; then
      sudo zypper install -y $pkgs
    elif [ "$pkg_manager" = "pacman" ]; then
      sudo pacman -S --noconfirm $pkgs
    fi
    echo ""
    echo "  ✓ Erledigt. Quark neu starten."
  else
    echo "  Übersprungen. Bei weißem Fenster den Befehl oben manuell ausführen."
  fi
  echo ""
}

# ── Reparatur-Modus direkt aufrufen: ./install-linux.sh --repair [AppImage] ──
if [ "${1:-}" = "--repair" ]; then
  shift
  APPIMAGE="${1:-}"
  if [ -z "$APPIMAGE" ]; then
    APPIMAGE="$(ls -t "$HOME/Downloads/Quark"*.AppImage 2>/dev/null | head -1)"
  fi
  repair_deps
  exit 0
fi

check_and_fix_deps

# ── Icon eingebettet – kein Download, kein curl/wget nötig ────────────────────
ICON_BASE="$HOME/.local/share/icons/hicolor"
ICON_DIR="$ICON_BASE/256x256/apps"
ICON_FILE="$ICON_DIR/de.quark.app.png"
mkdir -p "$ICON_DIR"

ICON_B64="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"

echo "$ICON_B64" | base64 -d > "$ICON_FILE" && echo "  Icon installiert." || echo "  Hinweis: Icon konnte nicht geschrieben werden."

# ── .desktop-Datei anlegen ─────────────────────────────────────────────────────
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/de.quark.app.desktop"
mkdir -p "$DESKTOP_DIR"

cat > "$DESKTOP_FILE" << DESKTOP
[Desktop Entry]
Name=Quark
Comment=Kostenloser QR-Code-Generator
Exec=env GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 $APPIMAGE %u
Icon=de.quark.app
Type=Application
Categories=Graphics;Utility;
StartupWMClass=Quark
Keywords=QR;QR-Code;Barcode;Generator;
Terminal=false
DESKTOP

echo "Desktop-Eintrag erstellt: $DESKTOP_FILE"

# ── Desktop-Datenbanken aktualisieren ──────────────────────────────────────────
gtk-update-icon-cache -f -t "$ICON_BASE" 2>/dev/null || true
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo ""
echo "✓ Quark wurde erfolgreich als Starter integriert!"
echo ""
echo "  Das App-Icon erscheint in:"
echo "  • GNOME Activities / Ubuntu-Anwendungsmenü"
echo "  • KDE Application Launcher"
echo "  • XFCE / MATE Anwendungsmenü"
echo ""
echo "  Falls der Eintrag noch nicht erscheint: Abmelden und neu anmelden."
echo ""
echo "  Weißes Fenster? Reparatur ausführen mit:"
echo "    ./install-linux.sh --repair"
echo ""

# ── Original-AppImage löschen? ─────────────────────────────────────────────────
if [ "$APPIMAGE_ORIGINAL" != "$APPIMAGE_INSTALLED" ] && [ -f "$APPIMAGE_ORIGINAL" ]; then
  printf "Original-Datei löschen? (%s) [j/N] " "$APPIMAGE_ORIGINAL"
  read -r answer
  if [[ "${answer:-n}" =~ ^[jJyY]$ ]]; then
    rm -f "$APPIMAGE_ORIGINAL"
    echo "  Gelöscht."
  fi
fi
