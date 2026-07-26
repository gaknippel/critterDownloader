use tauri::command;
use tauri::Manager;
use tauri::Emitter;
use std::process::{Command, Stdio};
use std::sync::Mutex;

struct AudioState {
    sink: Mutex<Option<rodio::Sink>>,
    stream_handle: Option<rodio::OutputStreamHandle>,
}

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    progress: f32,
    eta: String,
    speed: String,
}


fn find_yt_dlp(app_handle: &tauri::AppHandle) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let binary_name = "yt-dlp.exe";
    
    #[cfg(not(target_os = "windows"))]
    let binary_name = "yt-dlp";

    // 1. try updated yt-dlp in app data directory first
    if let Ok(app_data_path) = app_handle.path().app_data_dir() {
        let updated_path = app_data_path.join("binaries").join(binary_name);
        if updated_path.exists() {
            if let Some(path_str) = updated_path.to_str() {
                return Ok(path_str.to_string());
            }
        }
    }

    // 2. try bundled yt-dlp
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let bundled_path = resource_path.join("binaries").join(binary_name);
        if bundled_path.exists() {
            if let Some(path_str) = bundled_path.to_str() {
                return Ok(path_str.to_string());
            }
        }
    }
    
    // 3. try system path
    if Command::new("yt-dlp").arg("--version").output().is_ok() {
        return Ok("yt-dlp".to_string());
    }
    
    // 4. try common installation locations
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
    download_path: Option<String>,
    cookies_browser: Option<String>,
    cookies_file: Option<String>
) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp(&app_handle)?;
    let ffmpeg_path = find_ffmpeg(&app_handle);
    
    let output_template = if let Some(path) = download_path {
        format!("{}/%(title)s.%(ext)s", path)
    } else {
        "~/Downloads/%(title)s.%(ext)s".to_string()
    };
    
    let result = tokio::task::spawn_blocking(move || -> Result<std::process::Output, String> {
        let mut cmd = Command::new(&yt_dlp_path);
        
        // hide annoying console window on windows
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        
        // redirect output
        cmd.stdout(Stdio::piped())
           .stderr(Stdio::piped())
           .arg("--newline");
        
        if format.starts_with("audio") {
            cmd.arg("-x")
               .arg("--audio-format").arg("mp3");
            
            if format.contains('-') {
                if let Some(quality) = format.split('-').nth(1) {
                    cmd.arg("--audio-quality").arg(quality.to_uppercase());
                }
            }

            // Add ffmpeg location if found
            if let Some(ref ffmpeg) = ffmpeg_path {
                cmd.arg("--ffmpeg-location").arg(ffmpeg);
            }

            if let Some(ref path) = cookies_file {
                if !path.is_empty() {
                    cmd.arg("--cookies").arg(path);
                }
            } else if let Some(ref browser) = cookies_browser {
                if !browser.is_empty() && browser != "none" {
                    cmd.arg("--cookies-from-browser").arg(browser);
                }
            }

            cmd.arg("-o").arg(&output_template)
               .arg(&url);
        } else {
            // Check if format is a specific format_id
            if format != "video" && !format.is_empty() {
                let format_spec = format!("{}+bestaudio/{}", format, format);
                cmd.arg("-f").arg(format_spec)
                   .arg("--merge-output-format").arg("mp4");
            } else {
                cmd.arg("-f").arg("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
                   .arg("--merge-output-format").arg("mp4");
            }
            
            // force re-encoding of audio to AAC during merge
            cmd.arg("--postprocessor-args").arg("Merger:-c:a aac");
            
            // add ffmpeg location if found
            if let Some(ffmpeg) = ffmpeg_path {
                cmd.arg("--ffmpeg-location").arg(&ffmpeg);
            }
            
            if let Some(ref path) = cookies_file {
                if !path.is_empty() {
                    cmd.arg("--cookies").arg(path);
                }
            } else if let Some(ref browser) = cookies_browser {
                if !browser.is_empty() && browser != "none" {
                    cmd.arg("--cookies-from-browser").arg(browser);
                }
            }
            
            cmd.arg("-o").arg(&output_template)
               .arg(&url);
        }
        
        let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;
        
        if let Some(stdout) = child.stdout.take() {
            let reader = std::io::BufReader::new(stdout);
            use std::io::BufRead;
            for line_res in reader.lines() {
                if let Ok(line) = line_res {
                    if line.starts_with("[download]") {
                        if let Some(percent_idx) = line.find('%') {
                            let start_idx = "[download]".len();
                            let percent_str = &line[start_idx..percent_idx].trim();
                            if let Ok(percent) = percent_str.parse::<f32>() {
                                let speed = if let Some(at_idx) = line.find(" at ") {
                                    if let Some(eta_idx) = line.find(" ETA ") {
                                        line[at_idx + 4..eta_idx].trim().to_string()
                                    } else {
                                        "".to_string()
                                    }
                                } else {
                                    "".to_string()
                                };

                                let eta = if let Some(eta_idx) = line.find(" ETA ") {
                                    line[eta_idx + 5..].trim().to_string()
                                } else {
                                    "".to_string()
                                };

                                app_handle.emit("download-progress", ProgressPayload {
                                    progress: percent,
                                    eta,
                                    speed,
                                }).ok();
                            }
                        }
                    }
                }
            }
        }
        
        let output = child.wait_with_output().map_err(|e| format!("Failed to wait for yt-dlp: {}", e))?;
        Ok(output)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?;

    match result {
        Ok(output) => {
            if output.status.success() {
                Ok("Download completed successfully".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr).to_string();
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
    #[cfg(target_os = "windows")]
    let binary_name = "yt-dlp.exe";
    #[cfg(not(target_os = "windows"))]
    let binary_name = "yt-dlp";

    // get path for data directory
    let app_data_path = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let binaries_dir = app_data_path.join("binaries");
    let target_path = binaries_dir.join(binary_name);

    // if not in data, it's in bundle
    if !target_path.exists() {
        // binary dir exists
        std::fs::create_dir_all(&binaries_dir)
            .map_err(|e| format!("Failed to create binaries directory: {}", e))?;

        // find the current executable (bundled or system) to copy
        let current_path_str = find_yt_dlp(&app_handle)?;
        let current_path = std::path::Path::new(&current_path_str);

        if current_path.exists() {
            std::fs::copy(current_path, &target_path)
                .map_err(|e| format!("Failed to copy yt-dlp to app data directory: {}", e))?;
        } else {
            // ff find_yt_dlp returned "yt-dlp" (system command) or similar, look specifically for the bundled one
            let mut copied = false;
            if let Ok(resource_path) = app_handle.path().resource_dir() {
                let bundled_path = resource_path.join("binaries").join(binary_name);
                if bundled_path.exists() {
                    std::fs::copy(&bundled_path, &target_path)
                        .map_err(|e| format!("Failed to copy bundled yt-dlp to app data directory: {}", e))?;
                    copied = true;
                }
            }
            if !copied {
                return Err("No local yt-dlp binary found to update. System-wide installations must be updated manually.".to_string());
            }
        }
    }

    // now run the update command on the binary in the app data directory
    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&target_path);

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
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            if output.status.success() {
                if stdout.contains("is up to date") {
                    if let Some(line) = stdout.lines().find(|l| l.contains("is up to date")) {
                        Ok(line.trim().to_string())
                    } else {
                        Ok("yt-dlp is already up to date.".to_string())
                    }
                } else if stdout.contains("Updated yt-dlp to") {
                    if let Some(line) = stdout.lines().find(|l| l.contains("Updated yt-dlp to")) {
                        Ok(line.trim().to_string())
                    } else {
                        Ok("yt-dlp updated successfully!".to_string())
                    }
                } else {
                    Ok("yt-dlp updated successfully!".to_string())
                }
            } else {
                let err_msg = if !stderr.trim().is_empty() {
                    stderr.trim().to_string()
                } else if !stdout.trim().is_empty() {
                    stdout.trim().to_string()
                } else {
                    "Unknown error occurred during update".to_string()
                };
                Err(err_msg)
            }
        }
        Err(e) => Err(format!("Failed to update yt-dlp: {}", e)),
    }
}

#[command]
async fn get_video_info(
    app_handle: tauri::AppHandle, 
    url: String,
    cookies_browser: Option<String>,
    cookies_file: Option<String>
) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp(&app_handle)?;
    
    let result = tokio::task::spawn_blocking(move || {
        let mut cmd = Command::new(&yt_dlp_path);
        
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        
        if let Some(ref path) = cookies_file {
            if !path.is_empty() {
                cmd.arg("--cookies").arg(path);
            }
        } else if let Some(ref browser) = cookies_browser {
            if !browser.is_empty() && browser != "none" {
                cmd.arg("--cookies-from-browser").arg(browser);
            }
        }
        
        cmd.arg("-j")
           .arg(&url)
           .output()
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

#[command]
async fn play_sound(
    audio_state: tauri::State<'_, AudioState>,
    sound_path: Option<String>,
    volume: Option<f32>
) -> Result<(), String> {
    let inner = audio_state.inner();
    let stream_handle = match &inner.stream_handle {
        Some(h) => h.clone(),
        None => return Err("No audio output device available".to_string()),
    };

    // Stop any currently playing sound first
    if let Ok(mut guard) = inner.sink.lock() {
        if let Some(sink) = guard.take() {
            sink.stop();
        }
    }

    let result = tokio::task::spawn_blocking(move || -> Result<rodio::Sink, String> {
        let sink = match rodio::Sink::try_new(&stream_handle) {
            Ok(val) => val,
            Err(e) => return Err(format!("Failed to create audio sink: {}", e)),
        };

        if let Some(vol) = volume {
            sink.set_volume(vol);
        } else {
            sink.set_volume(0.5);
        }

        if let Some(path) = sound_path {
            if !path.is_empty() && path != "default" {
                let file = std::fs::File::open(&path)
                    .map_err(|e| format!("Failed to open custom sound file: {}", e))?;
                let source = rodio::Decoder::new(std::io::BufReader::new(file))
                    .map_err(|e| format!("Failed to decode custom sound file: {}", e))?;
                sink.append(source);
                return Ok(sink);
            }
        }

        // Default sound: embed the mp3 file
        let default_sound_bytes = include_bytes!("../../src/assets/downloadComplete.mp3");
        let cursor = std::io::Cursor::new(default_sound_bytes);
        let source = rodio::Decoder::new(cursor)
            .map_err(|e| format!("Failed to decode default sound file: {}", e))?;
        sink.append(source);
        Ok(sink)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?;

    match result {
        Ok(sink) => {
            if let Ok(mut guard) = inner.sink.lock() {
                *guard = Some(sink);
            }
            Ok(())
        }
        Err(e) => Err(e),
    }
}

#[command]
fn stop_sound(audio_state: tauri::State<'_, AudioState>) {
    let inner = audio_state.inner();
    if let Ok(mut guard) = inner.sink.lock() {
        if let Some(sink) = guard.take() {
            sink.stop();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (stream, stream_handle) = match rodio::OutputStream::try_default() {
        Ok((s, h)) => (Some(s), Some(h)),
        Err(_) => (None, None),
    };

    let audio_state = AudioState {
        sink: Mutex::new(None),
        stream_handle,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(audio_state)
        .invoke_handler(tauri::generate_handler![download_video, update_ytdlp, get_video_info, play_sound, stop_sound])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    // Explicitly drop stream on exit to keep it alive for the duration of run()
    drop(stream);
}