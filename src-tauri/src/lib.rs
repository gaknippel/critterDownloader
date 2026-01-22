use tauri::command;
use std::process::Command;

fn find_yt_dlp() -> Result<String, String> {
    let possible_paths = vec![
        "yt-dlp",  // try PATH first
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
fn download_video(url: String, format: String) -> Result<String, String> {
    let yt_dlp_path = find_yt_dlp()?;
    
    let output = if format == "audio" 
    {
        Command::new(&yt_dlp_path)
        .arg("-x")
        .arg("--audio-format").arg("mp3")
        .arg("-o").arg("~/Downloads/%(title)s.%(ext)s")
        .arg(&url)
        .output()
    }
    else 
    {
        Command::new(&yt_dlp_path)
        .arg("-f").arg("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
        .arg("-o").arg("~/Downloads/%(title)s.%(ext)s")
        .arg(&url) 
        .output()
    };

    match output
    {
        Ok(result) => {
            if result.status.success() 
            {
                Ok(String::from_utf8_lossy(&result.stdout).to_string())
            }
            else
            {
                Err(String::from_utf8_lossy(&result.stderr).to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}" , e)),
    }
}




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![download_video]) // Register command
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
