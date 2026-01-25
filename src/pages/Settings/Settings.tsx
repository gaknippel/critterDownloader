import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from '@/components/theme-provider';
import './Settings.css';

export default function Settings() {
  const { setTheme } = useTheme();
  const [downloadPath, setDownloadPath] = useState('');

  const handleBrowse = async () => {
    const result = await open({
      directory: true,
      multiple: false,
      defaultPath: await homeDir(),
    });
    if (result !== null) {
      setDownloadPath(result);
    }
  };

  return (
    <div className="settings-page-wrapper p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Appearance</h2>
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Theme</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Downloads</h2>
          <div className="space-y-2">
            <label htmlFor="download-path">Default download path</label>
            <div className="flex gap-2">
              <Input id="download-path" value={downloadPath} placeholder="Select a folder" disabled />
              <Button variant="outline" onClick={handleBrowse}>Browse</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}