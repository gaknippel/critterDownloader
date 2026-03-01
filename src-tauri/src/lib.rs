use tauri::command;
use tauri::Manager;
use std::process::{Command, Stdio};

fn find_yt_dlp(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // Try bundled yt-dlp first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let bundled_path = resource_path.join("binaries").join("yt-dlp.exe");
        if bundled_path.exists() {
            if let Some(path_str) = bundled_path.to_str() {
                return Ok(path_str.to_string());
            }
        }
    }
    
    // fallback to system yt-dlp
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
    
    Err("yt-dlp not found.".to_string())
}

#[command]
async fn download_video(
    app_handle: tauri::AppHandle,
    url: String, 
    format: String, 
    download_path: Option<String>
) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp(&app_handle)?;
    
    let output_template = if let Some(path) = download_path {
        format!("{}/%(title)s.%(ext)s", path)
    } else {
        "~/Downloads/%(title)s.%(ext)s".to_string()
    };
    
    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&yt_dlp_path);
        
        // hide console window on windows
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        
        // suppress output
        cmd.stdout(Stdio::null())
           .stderr(Stdio::piped());
        
        if format == "audio" {
            cmd.arg("-x")
               .arg("--audio-format").arg("mp3")
               .arg("-o").arg(&output_template)
               .arg(&url)
               .output()
        } else {
            cmd.arg("-f").arg("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
               .arg("-o").arg(&output_template)
               .arg(&url)
               .output()
        }
    })
    .await
    .map_err(|e| format!("task failed: {}", e))?;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok("download completed successfully".to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("failed to execute yt-dlp: {}", e)),
    }
}

#[command]
async fn update_ytdlp(app_handle: tauri::AppHandle) -> Result<String, String> 
{
    let yt_dlp_path = find_yt_dlp(&app_handle)?;

    tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&yt_dlp_path);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        cmd.arg("-U")  // update
        .output()
    })

    .await
    .map_err(|e| format!("Task failed: {}", e))?
    .map(|output| {
        if output.status.success()
        {
            Ok("yt-dlp updated successfully!".to_string()) 
        }
        else
        {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    })

    .map_err(|e| format!("failed to update yt-dlp: {}", e))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![download_video, update_ytdlp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}