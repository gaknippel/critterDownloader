import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store } from '@tauri-apps/plugin-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from '@/components/theme-provider';
import './Settings.css';

import SplitText from '../../components/SplitText'


export default function Settings() {

  const { setTheme } = useTheme();
  const [downloadPath, setDownloadPath] = useState('');
  const [store, setStore] = useState<Store | null>(null);


    useEffect(() => {
    const initStore = async () => {
      const newStore = await Store.load('settings.json');
      setStore(newStore);
      
      // Load saved download path
      const savedPath = await newStore.get<string>('downloadPath');
      if (savedPath) {
        setDownloadPath(savedPath);
      }
    };
    
    initStore();
  }, []);

const handleBrowse = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    
    if (selected && store) {
      setDownloadPath(selected);
      await store.set('downloadPath', selected);
      await store.save();
    }
  } catch (error) {
    console.error('Browse error:', error);
  }
};

  const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

  return (
    <div className="settings-page-wrapper p-4 md:p-6">

        <SplitText
          text="settings"
          className="about-welcome-message"
          delay={15}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">appearance</h2>
          <div className="flex items-center justify-between">
            <span>theme</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">theme</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  system
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">downloads</h2>
          <div className="space-y-2">
            <label htmlFor="download-path">default download path</label>
            <div className="flex gap-2">
              <Input id="download-path" value={downloadPath} placeholder="select a folder" disabled />
              <Button variant="outline" onClick={handleBrowse}>
                browse
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}