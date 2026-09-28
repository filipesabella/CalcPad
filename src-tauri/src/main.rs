// hides the console window on windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{App, LogicalSize, WebviewUrl, WebviewWindowBuilder};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let size = default_size(app);
            let _window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index-desktop.html".into()),
            )
            .title("CalcPad")
            .inner_size(size.width, size.height)
            .build()?;

            #[cfg(debug_assertions)]
            _window.open_devtools();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CalcPad");
}

// a half (or a third, on wide screens) of the primary monitor, full height.
// the window-state plugin overrides this once a size has been saved
fn default_size(app: &App) -> LogicalSize<f64> {
    app.primary_monitor()
        .ok()
        .flatten()
        .map(|monitor| {
            let size = monitor.size().to_logical::<f64>(monitor.scale_factor());
            let columns = if size.width > 2000.0 { 3.0 } else { 2.0 };
            LogicalSize::new(size.width / columns, size.height)
        })
        .unwrap_or(LogicalSize::new(800.0, 600.0))
}
