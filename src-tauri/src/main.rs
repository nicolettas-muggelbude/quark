// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Linux: GDK_BACKEND + WAYLAND_DISPLAY MÜSSEN vor GTK-Init gesetzt sein.
    // WebKitWebProcess initialisiert EGL bedingungslos beim Start – BEVOR
    // WEBKIT_DISABLE_DMABUF_RENDERER oder andere Flags greifen.
    //
    // Mesa wählt den EGL-Pfad anhand von Env-Vars:
    //   WAYLAND_DISPLAY gesetzt → Wayland-EGL  ← buggy auf AMD + Mesa 26
    //   WAYLAND_DISPLAY fehlt  → X11-EGL via DISPLAY=:0 ← funktioniert
    //
    // KDE Plasma hat immer XWayland → DISPLAY=:0 ist gesetzt.
    #[cfg(target_os = "linux")]
    {
        // In Flatpak: Wayland nativ nutzen — Runtime-Mesa hat den AMD/Mesa26-Bug nicht.
        // Außerhalb Flatpak: WAYLAND_DISPLAY entfernen → X11-EGL-Pfad (Workaround AMD+Mesa26).
        if std::env::var("FLATPAK_ID").is_err() {
            std::env::set_var("GDK_BACKEND", "x11");
            std::env::remove_var("WAYLAND_DISPLAY");
        }
    }

    quark_lib::run();
}
