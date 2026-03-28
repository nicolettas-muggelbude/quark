#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("quark".into()),
                    },
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                use webkit2gtk::{WebContext, WebContextExt};
                if let Some(ctx) = WebContext::default() {
                    ctx.set_sandbox_enabled(false);
                }
                // GDK_BACKEND=x11 und WAYLAND_DISPLAY-Remove sind in main.rs
                // (müssen vor GTK-Init gesetzt sein, nicht erst hier in setup())
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
                log::info!("WebKit-EGL-Fix aktiviert");
            }

            let main_window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Quark")
            .inner_size(900.0, 620.0)
            .min_inner_size(700.0, 500.0)
            .resizable(true)
            .build()
            .expect("Hauptfenster konnte nicht erstellt werden");

            #[cfg(target_os = "linux")]
            {
                use webkit2gtk::{SettingsExt, WebViewExt};
                let _ = main_window.with_webview(|wv| {
                    if let Some(settings) = wv.inner().settings() {
                        settings.set_hardware_acceleration_policy(
                            webkit2gtk::HardwareAccelerationPolicy::Never,
                        );
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("Fehler beim Erstellen der Tauri-Anwendung");
}
