# Quark — QR-Code-Generator

<img src="src/frontend/public/quark-frog.svg" width="140" alt="Quark Logo" />

Quark ist ein kostenloser, werbefreier QR-Code-Generator als Desktop-App für Linux und Windows.
Keine Cloud, kein Tracking, keine versteckten Kosten.

## Features
- URL eingeben, QR-Code live vorschauen
- Punkt- und Hintergrundfarbe frei wählbar
- Regenbogen-Farbverlauf
- PNG-Export in 256 / 512 / 1024 px (mit gewählten Farben)
- Letzten Speicherpfad merken
- Automatische Updates beim App-Start

## Download

| Betriebssystem | Download |
|---|---|
| **Linux** | [Quark_amd64.AppImage](https://github.com/nicolettas-muggelbude/quark/releases/latest/download/Quark_amd64.AppImage) |
| **Windows** | [Installer (.exe)](https://github.com/nicolettas-muggelbude/quark/releases/latest) |

### Linux: Desktop-Integration (einmalig)

Damit Quark im App-Menü erscheint und ans Dock geheftet werden kann:

```bash
# 1. AppImage ausführbar machen
chmod +x Quark_amd64.AppImage

# 2. Integrationsskript herunterladen und ausführen
wget https://github.com/nicolettas-muggelbude/quark/releases/latest/download/install-linux.sh
chmod +x install-linux.sh
./install-linux.sh ./Quark_amd64.AppImage
```

Das Skript installiert das AppImage nach `~/.local/bin/Quark.AppImage`, legt einen `.desktop`-Eintrag für GNOME, KDE und XFCE an, prüft Systemabhängigkeiten und fragt ob die Original-Datei aus dem Download-Ordner gelöscht werden soll.

Nach einem Auto-Update muss das Skript **nicht erneut** ausgeführt werden — der Updater ersetzt das AppImage direkt in `~/.local/bin/`.

## FAQ

**PNG-Export öffnet keinen Dialog auf KDE Plasma**

Quark benötigt `xdg-desktop-portal-kde` für den Datei-Dialog. Auf manchen minimalen Debian/KDE-Installationen fehlt dieses Paket:

```bash
sudo apt install xdg-desktop-portal-kde
systemctl --user restart xdg-desktop-portal
```

Danach Quark neu starten.

---

## Geplante Features
- Dot-Stile (rund, eckig, klassisch …)
- Farbverläufe (Gradient)
- Logo in QR einbetten
- SVG Export
- Rahmen + Text
- Batch-Generierung

## Build

```bash
npm install
cd src/frontend && npm install
npm run dev       # Entwicklungsmodus
npm run build     # Produktion (AppImage / EXE)
```

## Lizenz

AGPLv3 — siehe [LICENSE](LICENSE)
