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
- Linux WebKit-EGL-Fix immer beibehalten (GDK_BACKEND=x11, WEBKIT_DISABLE_DMABUF_RENDERER=1, Sandbox disabled, HW-Accel Never)
- Fenster werden in setup() programmatisch erstellt, nicht in tauri.conf.json
- Tailwind CSS v4 (@import "tailwindcss")
- Accent-Farbe: Emerald (#10b981) — Quark-Grün (Frosch)

## Versionsplanung
| Version | Features |
|---------|----------|
| v0.1 | URL → QR, PNG Export 256/512/1024px |
| v0.2 | Farben, Dot-Stile |
| v0.3 | SVG Export, Logo einbetten |
| v0.4 | Rahmen + Text |
| v0.5 | Batch-Generierung |
