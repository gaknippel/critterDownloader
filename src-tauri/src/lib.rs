use tauri::command;
use tauri::Manager;
use std::process::{Command, Stdio};

fn find_yt_dlp(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // try bundled yt-dlp first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        #[cfg(target_os = "windows")]
        let binary_name = "yt-dlp.exe";
        
        #[cfg(not(target_os = "windows"))]
        let binary_name = "yt-dlp";
        
        let bundled_path = resource_path.join("binaries").join(binary_name);
        if bundled_path.exists() {
            if let Some(path_str) = bundled_path.to_str() {
                return Ok(path_str.to_string());
            }
        }
    }
    
    // try system path
    if Command::new("yt-dlp").arg("--version").output().is_ok() {
        return Ok("yt-dlp".to_string());
    }
    
    // try common installation locations
    #[cfg(target_os = "windows")]
    let possible_paths = vec![
        r"C:\Program Files\yt-dlp\yt-dlp.exe",
    ];
    
    #[cfg(not(target_os = "windows"))]
    let possible_paths = vec![
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
    ];
    
    for path in possible_paths {
        if Command::new(path).arg("--version").output().is_ok() {
            return Ok(path.to_string());
        }
    }
    
    Err("yt-dlp not found. Please install yt-dlp.".to_string())
}

fn find_ffmpeg(app_handle: &tauri::AppHandle) -> Option<String> {
    // try bundled ffmpeg first
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        #[cfg(target_os = "windows")]
        let binary_name = "ffmpeg.exe";
        
        #[cfg(not(target_os = "windows"))]
        let binary_name = "ffmpeg";
        
        let bundled_path = resource_path.join("binaries").join(binary_name);
        if bundled_path.exists() {
            if let Some(path_str) = bundled_path.to_str() {
                return Some(path_str.to_string());
            }
        }
    }
    
    // try system path
    if Command::new("ffmpeg").arg("-version").output().is_ok() {
        return Some("ffmpeg".to_string());
    }
    
    // try common installation locations
    #[cfg(target_os = "windows")]
    let possible_paths = vec![
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
    ];
    
    #[cfg(not(target_os = "windows"))]
    let possible_paths = vec![
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        "/opt/homebrew/bin/ffmpeg",
    ];
    
    for path in possible_paths {
        if Command::new(path).arg("-version").output().is_ok() {
            return Some(path.to_string());
        }
    }
    
    None
}

#[command]
async fn download_video(
    app_handle: tauri::AppHandle,
    url: String, 
    format: String, 
    download_path: Option<String>
) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp(&app_handle)?;
    let ffmpeg_path = find_ffmpeg(&app_handle);
    
    let output_template = if let Some(path) = download_path {
        format!("{}/%(title)s.%(ext)s", path)
    } else {
        "~/Downloads/%(title)s.%(ext)s".to_string()
    };
    
    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&yt_dlp_path);
        
        // hide annoying console window on windows
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
               .arg(&url);
        } else {
            cmd.arg("-f").arg("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
               .arg("--merge-output-format").arg("mp4");
            
            // add ffmpeg location if found
            if let Some(ffmpeg) = ffmpeg_path {
                cmd.arg("--ffmpeg-location").arg(&ffmpeg);
            }
            
            cmd.arg("-o").arg(&output_template)
               .arg(&url);
        }
        
        cmd.output()
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok("Download completed successfully".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr).to_string();
                // Check if it's an FFmpeg issue
                if error.contains("ffmpeg") || error.contains("Postprocessing") {
                    Err("FFmpeg not found. Please install FFmpeg to merge video/audio streams.".to_string())
                } else {
                    Err(error)
                }
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[command]
async fn update_ytdlp(app_handle: tauri::AppHandle) -> Result<String, String> 
{
    let yt_dlp_path = find_yt_dlp(&app_handle)?;

    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&yt_dlp_path);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        cmd.arg("-U")
           .output()
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok("yt-dlp updated successfully!".to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Failed to update yt-dlp: {}", e)),
    }
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