# Quark — CLAUDE.md

## Projektüberblick
Desktop QR-Code-Generator für Linux und Windows.
- Stack: Tauri v2 + React 19 + TypeScript + Tailwind CSS v4 + Vite
- QR-Bibliothek: `qr-code-styling` (Frontend, kein Rust nötig für QR-Erzeugung)
- Lizenz: AGPLv3

## Struktur
```
src/frontend/     React-App (Vite)
src-tauri/        Rust/Tauri Backend
.github/workflows/build.yml   AppImage + EXE Release
```

## Wichtige Konventionen
- Linux WebKit-EGL-Fix immer beibehalten (GDK_BACKEND=x11, WEBKIT_DISABLE_DMABUF_RENDERER=1, WEBKIT_DISABLE_COMPOSITING_MODE=1, Sandbox disabled)
- Fenster werden in setup() programmatisch erstellt, nicht in tauri.conf.json
- Tailwind CSS v4 (@import "tailwindcss")
- Accent-Farbe: Emerald (#10b981) — Quark-Grün (Frosch)

## Layout
- Outer-Container: `h-screen flex flex-col` — fixe Höhe damit QR-Vorschau statisch bleibt
- Main: `overflow-hidden` — verhindert Page-Scroll und Hintergrund-Verlust beim Scrollen
- Linke Spalte: `overflow-y-auto` + `onWheel={e => e.currentTarget.scrollTop += e.deltaY}`
  - Der `onWheel`-Handler ist Pflicht für WSL2: WebKit leitet Mausrad-Events unter WSLg/XWayland
    nicht korrekt an CSS-Overflow-Elemente weiter; JS-seitiges Scrollen umgeht das.
- CollapsibleCard: kein `overflow-hidden` auf dem Container — sonst werden Farb-Picker-Popups abgeschnitten

## Beschriftungs-Feature (Label)
- `QrOptions.label` / `labelColor` / `labelFont` / `labelAlign` in `types.ts`
- Schriftgröße automatisch: `autoLabelFontSize()` berechnet aus Zeichenanzahl + QR-Breite
- Export: `fitFontSize()` nutzt `canvas.measureText` Loop für pixelgenaue Anpassung
- Vorschau: CSS-`fontSize` aus `autoLabelFontSize(label, 300)`
- Export: QR-PNG + Label auf neuem Canvas zusammengesetzt (Höhe = QR + Label-Bereich)

## Versionsplanung
| Version | Features |
|---------|----------|
| v0.1 | URL → QR, PNG Export 256/512/1024px |
| v0.2 ✓ | Farben (einfarbig + Regenbogen-Gradient), Clipboard-Einfügen |
| v0.2.4 ✓ | Text-Label unter QR (Schrift, Ausrichtung, Farbe, Auto-Größe), aufklappbare Panels |
| v0.3 | Dot-Stile, weitere Farbverläufe |
| v0.4 | SVG Export, Logo einbetten |
| v0.5 | Rahmen |
| v0.6 | Batch-Generierung |
