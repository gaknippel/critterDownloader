import { Minus, Square, X } from 'lucide-react'
import './TitleBar.css'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function TitleBar() {
  const appWindow = getCurrentWindow()

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-title pointer-events-none">
        <span className="text-xs font-semibold text-muted-foreground tracking-wider font-mono">
          critter downloader
        </span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn titlebar-minimize" onClick={() => appWindow.minimize()}>
          <Minus size={12} />
        </button>
        <button className="titlebar-btn titlebar-maximize" onClick={() => appWindow.toggleMaximize()}>
          <Square size={10} />
        </button>
        <button className="titlebar-btn titlebar-close" onClick={() => appWindow.close()}>
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar;
