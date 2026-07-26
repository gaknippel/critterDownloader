import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from '@/components/theme-provider';
import './Settings.css';

import SplitText from '../../components/SplitText'


import { toast } from 'sonner';
import { HelpCircle, Cookie, Play, Volume2, Square, VolumeX, Volume1, FolderOpen, Trash2, RefreshCw } from 'lucide-react';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState<'default' | 'custom'>('default');
  const [soundFilePath, setSoundFilePath] = useState('');
  const [soundVolume, setSoundVolume] = useState(0.5);
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

      // Load saved sound settings
      const savedSoundEnabled = await newStore.get<boolean>('soundEnabled') !== false;
      setSoundEnabled(savedSoundEnabled);

      const savedSoundType = await newStore.get<string>('soundType') || 'default';
      setSoundType(savedSoundType as 'default' | 'custom');

      const savedSoundFilePath = await newStore.get<string>('soundFilePath') || '';
      setSoundFilePath(savedSoundFilePath);

      const savedSoundVolume = await newStore.get<number>('soundVolume');
      setSoundVolume(savedSoundVolume !== undefined ? savedSoundVolume : 0.5);
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

  const handleSoundEnabledChange = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (store) {
      await store.set('soundEnabled', enabled);
      await store.save();
      toast.success(`download sound notification ${enabled ? 'enabled' : 'disabled'}!`);
    }
  };

  const handleSoundTypeChange = async (type: 'default' | 'custom') => {
    setSoundType(type);
    if (store) {
      await store.set('soundType', type);
      await store.save();
      toast.success(`notification sound set to ${type === 'default' ? 'default sound' : 'custom sound'}!`);
    }
  };

  const handleBrowseSoundFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
      });

      const pathStr = Array.isArray(selected) ? selected[0] : (selected || '');
      
      if (pathStr && store) {
        setSoundFilePath(pathStr);
        await store.set('soundFilePath', pathStr);
        await store.save();
        toast.success('custom notification sound path saved!');
      }
    } catch (error) {
      console.error('Browse error:', error);
      toast.error('failed to select custom sound file: ' + String(error));
    }
  };

  const handleTestSound = async () => {
    try {
      await invoke('play_sound', { 
        soundPath: soundType === 'custom' ? soundFilePath : 'default',
        volume: soundVolume
      });
    } catch (error) {
      toast.error('failed to play test sound: ' + String(error));
    }
  };

  const handleSoundVolumeChange = async (vol: number) => {
    setSoundVolume(vol);
    if (store) {
      await store.set('soundVolume', vol);
      await store.save();
    }
  };

  const handleStopSound = async () => {
    try {
      await invoke('stop_sound');
    } catch (error) {
      toast.error('failed to stop sound: ' + String(error));
    }
  };

  const handleClearSoundFile = async () => {
    setSoundFilePath('');
    if (store) {
      await store.set('soundFilePath', '');
      await store.save();
      toast.success('custom sound file cleared!');
    }
  };

  const handleClearCookiesFilePath = async () => {
    setCookiesFilePath('');
    if (store) {
      await store.set('cookiesFilePath', '');
      await store.save();
      toast.success('custom cookies file cleared!');
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
          <h2 className="text-xl font-semibold">appearance</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            select the application's color theme and visual aesthetic.
          </p>

          <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">active theme</span>
              <span className="text-xs text-muted-foreground">instantly switch the visual palette.</span>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {['light', 'dark', 'midnight', 'forest', 'sunset', 'system'].map((t) => {
                const themeColors: Record<string, string> = {
                  light: '#fafafa',
                  dark: '#18181b',
                  midnight: '#030712',
                  forest: '#064e3b',
                  sunset: '#7c2d12',
                };
                
                const dotBg = t === 'system' 
                  ? 'linear-gradient(135deg, #e4e4e7 50%, #27272a 50%)' 
                  : themeColors[t] || '#ccc';

                return (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t as any)}
                    className={`text-xs px-3 py-2 rounded-lg font-medium transition-all capitalize border flex items-center gap-2 ${
                      theme === t
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-border/20"
                      style={{ background: dotBg }}
                    />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">downloads</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            configure where files are stored and how bot-checks are bypassed.
          </p>

          <div className="space-y-4">
            
            {/* Default Download Path Section */}
            <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">default download path</span>
                <span className="text-xs text-muted-foreground">where your downloaded video and audio files are saved.</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Input 
                  id="download-path" 
                  value={downloadPath} 
                  placeholder="no folder selected - click browse" 
                  readOnly 
                  className="text-xs font-mono h-9"
                />
                <Button variant="outline" size="sm" onClick={handleBrowse} className="flex items-center gap-1.5 h-9 shrink-0">
                  <FolderOpen className="h-4 w-4" />
                  browse
                </Button>
              </div>
            </div>

            <div className="space-y-3.5 pt-3 border-t border-border/20">
              {/* Main Cookies Selector */}
              <div className="flex items-center justify-between gap-4">
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

                <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/30 shrink-0">
                  <button
                    onClick={() => handleCookiesBrowserChange("none")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                      cookiesBrowser === 'none'
                        ? 'bg-background shadow-xs text-foreground border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    disabled
                  </button>
                  <button
                    onClick={() => {
                      const lastBrowser = ['chrome', 'firefox', 'edge', 'brave', 'opera'].includes(cookiesBrowser) 
                        ? cookiesBrowser 
                        : 'chrome';
                      handleCookiesBrowserChange(lastBrowser);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                      ['chrome', 'firefox', 'edge', 'brave', 'opera'].includes(cookiesBrowser)
                        ? 'bg-background shadow-xs text-foreground border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    browser
                  </button>
                  <button
                    onClick={() => handleCookiesBrowserChange("custom")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                      cookiesBrowser === 'custom'
                        ? 'bg-background shadow-xs text-foreground border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    custom
                  </button>
                </div>
              </div>

              {/* Sub-selector for specific browser */}
              {['chrome', 'firefox', 'edge', 'brave', 'opera'].includes(cookiesBrowser) && (
                <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-xs text-muted-foreground font-semibold">select browser</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['chrome', 'firefox', 'edge', 'brave', 'opera'].map((browserName) => {
                      const logoUrls: Record<string, string> = {
                        chrome: 'https://cdn.jsdelivr.net/npm/@browser-logos/chrome@latest/chrome.svg',
                        firefox: 'https://cdn.jsdelivr.net/npm/@browser-logos/firefox@latest/firefox.svg',
                        edge: 'https://cdn.jsdelivr.net/npm/@browser-logos/edge@latest/edge.svg',
                        brave: 'https://cdn.jsdelivr.net/npm/@browser-logos/brave@latest/brave.svg',
                        opera: 'https://cdn.jsdelivr.net/npm/@browser-logos/opera@latest/opera.svg',
                      };
                      return (
                        <button
                          key={browserName}
                          onClick={() => handleCookiesBrowserChange(browserName)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all capitalize border flex items-center gap-1.5 ${
                            cookiesBrowser === browserName
                              ? 'bg-foreground text-background border-foreground shadow-sm'
                              : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <img 
                            src={logoUrls[browserName]} 
                            alt={`${browserName} logo`} 
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                          {browserName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Cookies File Path */}
              {cookiesBrowser === 'custom' && (
                <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-xs text-muted-foreground font-semibold">custom cookies.txt file</span>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Input 
                        id="cookies-file-path" 
                        value={cookiesFilePath} 
                        placeholder="select your exported cookies.txt file" 
                        readOnly 
                        className="text-xs font-mono pr-8 h-9"
                      />
                      {cookiesFilePath && (
                        <button 
                          className="absolute right-2.5 text-muted-foreground hover:text-destructive transition-colors" 
                          onClick={handleClearCookiesFilePath}
                          title="Clear cookies file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleBrowseCookiesFile} className="flex items-center gap-1.5 h-9">
                      <FolderOpen className="h-4 w-4" />
                      browse
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 italic mt-1">
                    * export cookies using a browser extension and select the file here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">notification sound</h2>
            <Button 
              variant={soundEnabled ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleSoundEnabledChange(!soundEnabled)}
            >
              {soundEnabled ? 'enabled' : 'disabled'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            play a cool little chime when your download is done.
          </p>

          {soundEnabled && (
            <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              
              {/* Sound Source Selector */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">sound source</span>
                <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/30 shrink-0">
                  <button
                    onClick={() => handleSoundTypeChange('default')}
                    className={`text-xs px-3.5 py-1.5 rounded-md font-medium transition-all ${
                      soundType === 'default'
                        ? 'bg-background shadow-xs text-foreground border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    default
                  </button>
                  <button
                    onClick={() => handleSoundTypeChange('custom')}
                    className={`text-xs px-3.5 py-1.5 rounded-md font-medium transition-all ${
                      soundType === 'custom'
                        ? 'bg-background shadow-xs text-foreground border border-border/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    custom
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-sm font-medium">volume</span>
                <div className="flex items-center gap-2.5 flex-1 max-w-[200px]">
                  {soundVolume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : soundVolume < 0.5 ? (
                    <Volume1 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={soundVolume} 
                    onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-foreground cursor-pointer h-1 bg-muted rounded-lg appearance-none"
                  />
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Playback Test Controls */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-sm font-medium">test playback</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestSound} 
                    className="h-8 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    play test
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStopSound} 
                    className="h-8 px-3 text-xs flex items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Square className="h-2.5 w-2.5 fill-current" />
                    stop
                  </Button>
                </div>
              </div>

              {/* Custom File Selector */}
              {soundType === 'custom' && (
                <div className="space-y-1.5 pt-2 border-t border-border/20 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label htmlFor="sound-file-path" className="text-xs text-muted-foreground font-semibold">custom sound file</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Input 
                        id="sound-file-path" 
                        value={soundFilePath} 
                        placeholder="no file selected - click browse" 
                        readOnly 
                        className="text-xs font-mono pr-8 h-9"
                      />
                      {soundFilePath && (
                        <button 
                          className="absolute right-2.5 text-muted-foreground hover:text-destructive transition-colors" 
                          onClick={handleClearSoundFile}
                          title="Clear custom sound"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleBrowseSoundFile} className="flex items-center gap-1.5 h-9">
                      <FolderOpen className="h-4 w-4" />
                      browse
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold">updates</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            keep the backend downloading tool up to date.
          </p>

          <div className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">yt-dlp downloading engine</span>
                <span className="text-xs text-muted-foreground">updates are recommended if downloads start failing.</span>
              </div>
              <Button 
                onClick={handleUpdateYtdlp} 
                disabled={updating}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 shrink-0 h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'updating...' : 'update yt-dlp'}
              </Button>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}