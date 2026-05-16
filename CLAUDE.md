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

## Rahmen-Feature (Frame)
- `QrOptions.frame: FrameOptions` in `types.ts`
- Stile: `none | simple | corners | badge-top | badge-bottom`
  - `corners`: einheitlicher Stil, Radius-Slider (0 = eckig, 20 = abgerundet) — kein separater corners-square/corners-round
- Felder: `color`, `width` (1–10), `radius` (0–20, alle Stile außer none), `innerPad` (eng/weit), `text` + `textColor` (nur badge)
- Vorschau: CSS-Border + absolute Div-Ecken (corners) bzw. border + Badge-Div (simple/badge)
  - QR immer 300px — Rahmen/Ecken wachsen nach außen
  - Gap-Werte: `eng=10`, `weit=24` (px, bei 300px QR)
- Export: Canvas-Clipping für Rundungen, `drawRoundRect()` Hilfsfunktion, Corner-L-Shapes per ctx.stroke()
  - Canvas = immer exakt gewählte Größe (256/512/1024px), QR+Rahmen proportional skaliert
  - Gap-Rohwerte (bei 300px Referenz): `eng=15`, `weit=16`
  - `scale = size / totalW_prev` — totalW_prev berechnet aus Rahmenstil + gap_raw + fw_raw
- Label bleibt immer INNERHALB des Rahmens (unter dem QR, über dem Badge bei badge-bottom)
- `fitFontSize()` wird auch für Badge-Text genutzt

## Versionsplanung
| Version | Features |
|---------|----------|
| v0.1 | URL → QR, PNG Export 256/512/1024px |
| v0.2 ✓ | Farben (einfarbig + Regenbogen-Gradient), Clipboard-Einfügen |
| v0.2.4 ✓ | Text-Label unter QR (Schrift, Ausrichtung, Farbe, Auto-Größe), aufklappbare Panels |
| v0.3 ✓ | Rahmen (Rand, Ecken eckig/rund, Badge oben/unten) |
| v1.0 ✓ | Stabiler Release: Export pixelidentisch zur Vorschau, Gap-Feinabstimmung |
| v1.1 | Dot-Stile, weitere Farbverläufe |
| v1.2 | SVG Export, Logo einbetten |
| v1.3 | Batch-Generierung |
