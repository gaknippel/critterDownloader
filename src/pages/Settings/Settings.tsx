import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from '@/components/theme-provider';
import './Settings.css';

import SplitText from '../../components/SplitText'


import { toast } from 'sonner';


export default function Settings() {

  const { theme, setTheme } = useTheme();
  const [downloadPath, setDownloadPath] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [updating, setUpdating] = useState(false);



    useEffect(() => {
    const initStore = async () => {
      console.log('initializing store');
      const newStore = await Store.load('settings.json');
      console.log('store loaded:', newStore);
      setStore(newStore);
      
      // Load saved download path
      const savedPath = await newStore.get<string>('downloadPath');
      console.log('loaded savedPath from store:', savedPath);
      if (savedPath) {
        setDownloadPath(savedPath);
        console.log('set downloadPath state to:', savedPath);
      }
    };
    
    initStore();
  }, []);

const handleBrowse = async () => {
  try {
    console.log('Browse clicked, store is: ', store);
    const selected = await open({
      directory: true,
      multiple: false,
    });

    console.log('selected path: ', selected);
    
    if (selected && store) {
      console.log('setting downloadPath to:', selected);
      setDownloadPath(selected);
      console.log('saving to store...');
      await store.set('downloadPath', selected);
      await store.save();
      console.log('saved successfully!');
      toast.success('download path saved successfully!');
    }
    else 
    {
      console.log('Either no selection or no store. selected:', selected, 'store:', store);
    }
  } catch (error) {
    console.error('Browse error:', error);
    toast.error('failed to select download path: ' + String(error));
  }
};


  const handleUpdateYtdlp = async () => {
    setUpdating(true);
    const toastId = toast.loading('updating yt-dlp...');
    
    try {
      const result = await invoke('update_ytdlp');
      toast.success(String(result), { id: toastId });
    } catch (error) {
      toast.error(String(error), { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const handleThemeChange = (theme: Parameters<typeof setTheme>[0]) => {
    setTheme(theme);
    toast.success(`theme set to ${theme}!`);
  };

  const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

 return (
    <div className="settings-page-wrapper p-4 md:p-6">
      <SplitText
        text="settings"
        className="settings-welcome-message"
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
                <Button variant="outline">{theme}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                  light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                  dark
                </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleThemeChange("midnight")}>
                  midnight
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("forest")}>
                  forest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("sunset")}>
                  sunset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
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
              <Input 
                id="download-path" 
                value={downloadPath} 
                placeholder="select a folder" 
                readOnly 
              />
              <Button variant="outline" onClick={handleBrowse}>
                browse
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">updates</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              keep yt-dlp up to date for the best performance
            </p>
            <Button 
              onClick={handleUpdateYtdlp} 
              disabled={updating}
              variant="outline"
            >
              {updating ? 'updating yt-dlp...' : 'update yt-dlp'}
            </Button>
          </div>
        </section>
      </div>

    </div>
  );
}