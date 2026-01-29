use tauri::command;
use std::process::Command;

fn find_yt_dlp() -> Result<String, String> {
    let possible_paths = vec![
        "yt-dlp",
        r"C:\Users\burri\AppData\Local\Microsoft\WinGet\Links\yt-dlp.exe",
        r"C:\Program Files\yt-dlp\yt-dlp.exe",
    ];
    
    for path in possible_paths {
        if Command::new(path).arg("--version").output().is_ok() {
            return Ok(path.to_string());
        }
    }
    
    Err("yt-dlp not found. please install it.".to_string())
}

#[command]
async fn download_video(url: String, format: String, download_path: Option<String>) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp()?;
    
    let output_template = if let Some(path) = download_path {
        format!("{}/%(title)s.%(ext)s", path)
    } else {
        "~/Downloads/%(title)s.%(ext)s".to_string()
    };
    
    // Run in a blocking task to avoid freezing UI
    let result = tokio::task::spawn_blocking(move || {
        if format == "audio" {
            Command::new(&yt_dlp_path)
                .arg("-x")
                .arg("--audio-format").arg("mp3")
                .arg("-o").arg(&output_template)
                .arg(&url)
                .output()
        } else {
            Command::new(&yt_dlp_path)
                .arg("-f").arg("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
                .arg("-o").arg(&output_template)
                .arg(&url)
                .output()
        }
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![download_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}