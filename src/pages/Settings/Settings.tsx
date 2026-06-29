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
import { HelpCircle, Cookie } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import cookiesExportImg from '../../assets/cookiesExport.png';


export default function Settings() {

  const { theme, setTheme } = useTheme();
  const [downloadPath, setDownloadPath] = useState('');
  const [cookiesBrowser, setCookiesBrowser] = useState('none');
  const [cookiesFilePath, setCookiesFilePath] = useState('');
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

      // Load saved cookies browser
      const savedBrowser = await newStore.get<string>('cookiesBrowser') || 'none';
      setCookiesBrowser(savedBrowser);

      // Load saved cookies file path
      const savedCookiesPath = await newStore.get<string>('cookiesFilePath') || '';
      setCookiesFilePath(savedCookiesPath);
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


  const handleCookiesBrowserChange = async (browser: string) => {
    setCookiesBrowser(browser);
    if (store) {
      await store.set('cookiesBrowser', browser);
      await store.save();
      toast.success(`cookies source set to ${browser === 'none' ? 'disabled' : browser === 'custom' ? 'custom cookies.txt' : browser}!`);
    }
  };

  const handleBrowseCookiesFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      });

      const pathStr = Array.isArray(selected) ? selected[0] : (selected || '');
      
      if (pathStr && store) {
        setCookiesFilePath(pathStr);
        await store.set('cookiesFilePath', pathStr);
        await store.save();
        toast.success('cookies.txt file path saved successfully!');
      }
    } catch (error) {
      console.error('Browse error:', error);
      toast.error('failed to select cookies.txt file: ' + String(error));
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
          <div className="space-y-4">
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <label className="text-sm font-medium">cookies source (bypass bot check)</label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0" 
                        title="how to export cookies"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md border border-border shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                          <Cookie className="h-5 w-5 text-amber-500" />
                          how to export cookies
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          youtube has bot-checking encryptions, so we can export our cookies to 
                          bypass it. if your browser is unsupported, use the custom cookies option in the dropdown menu.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 text-xs mt-1 text-foreground/90">
                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-foreground/80">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
                            install a cookie extension
                          </p>
                          <p className="text-muted-foreground pl-6">
                            Install a cookie export extension (e.g. <strong>"Get cookies.txt LOCALLY"</strong>) from your browser's extension store.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-foreground/80">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
                            export cookies from youtube
                          </p>
                          <p className="text-muted-foreground pl-6">
                            go to youtube, make sure you are logged in, open the extension, and click the <strong>"export as"</strong> button and export your cookies as a txt file.
                          </p>
                          <div className="pl-6 pt-1">
                            <img 
                              src={cookiesExportImg} 
                              alt="Export cookies illustration" 
                              className="w-full h-auto object-contain rounded-lg border bg-muted/20 shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-foreground/80">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">3</span>
                            load the file in settings
                          </p>
                          <p className="text-muted-foreground pl-6">
                            Select <strong>"custom cookies.txt file"</strong> from the dropdown, click <strong>"browse"</strong>, and choose your downloaded file.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground pr-4">
                  uses logged-in session cookies from your browser(s) to bypass youtube's bot checks.
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="capitalize">{cookiesBrowser === 'none' ? 'disabled' : cookiesBrowser === 'custom' ? 'custom cookies.txt' : cookiesBrowser}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("none")}>
                    disabled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("custom")}>
                    custom cookies.txt file
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("chrome")}>
                    chrome
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("firefox")}>
                    firefox
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("edge")}>
                    edge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("brave")}>
                    brave
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("opera")}>
                    opera
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCookiesBrowserChange("vivaldi")}>
                    vivaldi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {cookiesBrowser === 'custom' && (
              <div className="space-y-2 mt-2 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="cookies-file-path" className="text-xs text-muted-foreground">cookies.txt file path</label>
                <div className="flex gap-2">
                  <Input 
                    id="cookies-file-path" 
                    value={cookiesFilePath} 
                    placeholder="select your exported cookies.txt file" 
                    readOnly 
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" onClick={handleBrowseCookiesFile}>
                    browse
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 italic">
                  * export cookies using a browser extension and select the file here.
                </p>
              </div>
            )}
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