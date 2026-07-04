import { useState, useEffect, useRef } from 'react';
import './Download.css'
import SplitText from '../../components/SplitText'
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { Button } from '@/components/ui/button';
import { Loader2, History, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { open } from '@tauri-apps/plugin-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { downloadDir } from '@tauri-apps/api/path'; 
import blackCat from '../../assets/blackCat.gif';
import soundcloudLogo from '../../assets/soundcloudLogo.png';

interface YtDlpFormat {
  format_id: string;
  height: number | null;
  width: number | null;
  ext: string;
  format_note: string | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  filesize_approx: number | null;
  fps: number | null;
}

interface YtDlpVideoInfo {
  title: string;
  thumbnail: string;
  duration_string: string;
  formats: YtDlpFormat[];
}

const extractResolutions = (formats: YtDlpFormat[]) => {
  const resolutionsMap = new Map<number, YtDlpFormat>();
  
  formats.forEach(f => {
    if (f.height && f.vcodec !== 'none') {
      const existing = resolutionsMap.get(f.height);
      if (!existing || (f.filesize || f.filesize_approx || 0) > (existing.filesize || existing.filesize_approx || 0)) {
        resolutionsMap.set(f.height, f);
      }
    }
  });

  return Array.from(resolutionsMap.values())
    .sort((a, b) => (b.height || 0) - (a.height || 0));
};

const YOUTUBE_REGEX = /^(https?:\/\/)?((www|m|music|gaming)\.)?(youtube\.com\/(watch\?|shorts\/|live\/|v\/|embed\/)|youtu\.be\/).+$/;
const SOUNDCLOUD_REGEX = /^(https?:\/\/)?(((www|m)\.)?soundcloud\.com|on\.soundcloud\.com)\/.+$/;

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill="#EF4444" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" stroke="white" strokeWidth="1" />
  </svg>
);

const sanitizeAndValidateUrl = (rawUrl: string): { isValid: boolean; sanitizedUrl: string; error?: string } => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { isValid: false, sanitizedUrl: trimmed };
  }

  const isYoutube = YOUTUBE_REGEX.test(trimmed) || 
                    trimmed.includes('youtube.com') || 
                    trimmed.includes('youtu.be');
                    
  const isSoundcloud = SOUNDCLOUD_REGEX.test(trimmed) || 
                       trimmed.includes('soundcloud.com');

  if (!isYoutube && !isSoundcloud) {
    return { 
      isValid: false, 
      sanitizedUrl: trimmed, 
      error: 'please enter a valid youtube or soundcloud link.' 
    };
  }

  if (isYoutube) {
    if (
      trimmed.includes('/playlist') || 
      trimmed.includes('/channel/') || 
      trimmed.includes('/c/') || 
      trimmed.includes('/user/') || 
      trimmed.includes('/@')
    ) {
      return { 
        isValid: false, 
        sanitizedUrl: trimmed, 
        error: 'playlists and channels are not supported. please enter a single video link.' 
      };
    }

    try {
      let urlString = trimmed;
      if (!/^https?:\/\//i.test(urlString)) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);

      if (url.pathname.includes('/watch')) {
        const videoId = url.searchParams.get('v');
        if (!videoId) {
          return { 
            isValid: false, 
            sanitizedUrl: trimmed, 
            error: 'playlist links are not supported. please enter a single video link.' 
          };
        }
        
        const cleanUrl = new URL(url.origin + url.pathname);
        cleanUrl.searchParams.set('v', videoId);
        const time = url.searchParams.get('t');
        if (time) {
          cleanUrl.searchParams.set('t', time);
        }
        return { isValid: true, sanitizedUrl: cleanUrl.toString() };
      }

      url.searchParams.delete('list');
      url.searchParams.delete('index');
      url.searchParams.delete('playnext');

      return { isValid: true, sanitizedUrl: url.toString() };
    } catch (e) {
      return { 
        isValid: false, 
        sanitizedUrl: trimmed, 
        error: 'invalid URL format.' 
      };
    }
  }

  if (isSoundcloud) {
    try {
      let urlString = trimmed;
      if (!/^https?:\/\//i.test(urlString)) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);
      
      if (url.hostname === 'on.soundcloud.com' || url.hostname.endsWith('.on.soundcloud.com')) {
        const cleanUrl = new URL(url.origin + url.pathname);
        return { isValid: true, sanitizedUrl: cleanUrl.toString() };
      }

      const segments = url.pathname.split('/').filter(Boolean);
      
      if (segments.length !== 2) {
        return {
          isValid: false,
          sanitizedUrl: trimmed,
          error: 'soundcloud playlists, albums, sets, and profiles are not supported. please enter a single track link.'
        };
      }

      const reservedWords = ['sets', 'stations', 'likes', 'tracks', 'albums', 'playlists', 'reposts', 'comments', 'groups', 'messages', 'popular', 'you'];
      if (reservedWords.includes(segments[1].toLowerCase()) || reservedWords.includes(segments[0].toLowerCase())) {
        return {
          isValid: false,
          sanitizedUrl: trimmed,
          error: 'please enter a single track link.'
        };
      }

      const cleanUrl = new URL(url.origin + url.pathname);
      return { isValid: true, sanitizedUrl: cleanUrl.toString() };
    } catch (e) {
      return {
        isValid: false,
        sanitizedUrl: trimmed,
        error: 'invalid SoundCloud URL.'
      };
    }
  }

  return { isValid: false, sanitizedUrl: trimmed };
};

const handleAnimationComplete = () => {
  console.log('all letters have animated!');
};

export default function Download() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('video');
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [videoInfo, setVideoInfo] = useState<YtDlpVideoInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [videoComboboxOpen, setVideoComboboxOpen] = useState(false);
  const [audioComboboxOpen, setAudioComboboxOpen] = useState(false);
  const [cookiesBrowser, setCookiesBrowser] = useState('none');

  const { isValid: isValidLink, sanitizedUrl, error: validationError } = sanitizeAndValidateUrl(link);
  const isYoutubeLink = YOUTUBE_REGEX.test(link.trim()) || link.includes('youtube.com') || link.includes('youtu.be');
  const isSoundcloudLink = SOUNDCLOUD_REGEX.test(link.trim()) || link.includes('soundcloud.com');
  const isDownloadDisabled = loading || loadingInfo || !isValidLink || (isValidLink && !videoInfo);

  // Auto-switch to audio format if SoundCloud link is detected
  useEffect(() => {
    if (isSoundcloudLink && format !== 'audio') {
      handleFormatChange('audio');
    }
  }, [link, isSoundcloudLink, format]);

  // load download path from settings
  useEffect(() => {
    const loadPath = async () => {
      const newStore = await Store.load('settings.json');
      setStore(newStore);
      let savedPath = await newStore.get<string>('downloadPath');
      
      // if no path saved, set default to downloads folder
      if (!savedPath) {
        savedPath = await downloadDir();  // downloads folder
        await newStore.set('downloadPath', savedPath);
        console.log('First launch - set default path:', savedPath);
      }
      
      setDownloadPath(savedPath);

      // load download path history
      let history = await newStore.get<string[]>('pathHistory') || [];
      history = history.filter(Boolean);
      if (savedPath && !history.includes(savedPath)) {
        history.unshift(savedPath);
        history = history.slice(0, 5);
        await newStore.set('pathHistory', history);
      }
      setPathHistory(history);

      // load cookies browser setting
      const savedBrowser = await newStore.get<string>('cookiesBrowser') || 'none';
      setCookiesBrowser(savedBrowser);

      await newStore.save();
    };
    
    loadPath();
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
        
        let history = await store.get<string[]>('pathHistory') || [];
        history = [selected, ...history.filter(p => p !== selected)].slice(0, 5);
        setPathHistory(history);
        await store.set('pathHistory', history);
        
        await store.save();
        toast.success('download path saved successfully!');
      }
    } catch (error) {
      console.error('Browse error:', error);
      toast.error('failed to select download path: ' + String(error));
    }
  };

  const handleSelectHistoryPath = async (path: string) => {
    if (store) {
      setDownloadPath(path);
      await store.set('downloadPath', path);
      
      let history = await store.get<string[]>('pathHistory') || [];
      history = [path, ...history.filter(p => p !== path)].slice(0, 5);
      setPathHistory(history);
      await store.set('pathHistory', history);
      
      await store.save();
      toast.success('download destination updated!');
    }
  };

  // Keep a ref of format state to prevent stale closures inside useEffect fetchInfo
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (newFormat === 'audio') {
      setSelectedFormatId('audio-320k');
    } else if (newFormat === 'video' && videoInfo) {
      const resolutions = extractResolutions(videoInfo.formats);
      if (resolutions.length > 0) {
        setSelectedFormatId(resolutions[0].format_id);
      } else {
        setSelectedFormatId('');
      }
    } else {
      setSelectedFormatId('');
    }
  };

  // fetch video options when link changes
  useEffect(() => {
    if (isValidLink) {
      const fetchInfo = async () => {
        setLoadingInfo(true);
        setVideoInfo(null);
        setSelectedFormatId('');
        try {
          const activeStore = store || await Store.load('settings.json');
          const currentBrowser = await activeStore.get<string>('cookiesBrowser') || 'none';
          const cookiesFile = await activeStore.get<string>('cookiesFilePath') || null;
          const result = await invoke('get_video_info', { 
            url: sanitizedUrl,
            cookiesBrowser: currentBrowser === 'none' ? null : currentBrowser,
            cookiesFile: currentBrowser === 'custom' ? cookiesFile : null
          });
          const parsed: YtDlpVideoInfo = JSON.parse(String(result));
          setVideoInfo(parsed);
          
          if (formatRef.current === 'audio') {
            setSelectedFormatId('audio-320k');
          } else {
            const resolutions = extractResolutions(parsed.formats);
            if (resolutions.length > 0) {
              setSelectedFormatId(resolutions[0].format_id);
            }
          }
        } catch (error) {
          console.error('Failed to get video info:', error);
          toast.error('failed to fetch video options: ' + String(error));
        } finally {
          setLoadingInfo(false);
        }
      };
      
      const timeoutId = setTimeout(fetchInfo, 600);
      return () => clearTimeout(timeoutId);
    } else {
      setVideoInfo(null);
      setSelectedFormatId('');
      setLoadingInfo(false);
    }
  }, [link, isValidLink, sanitizedUrl]);

  const handleDownload = async () => {
    if (!isValidLink) {
      toast.error(validationError || 'please enter a valid youtube link son');
      return;
    }


    setLoading(true);

    try {
      const activeStore = store || await Store.load('settings.json');
      const currentBrowser = await activeStore.get<string>('cookiesBrowser') || 'none';
      const cookiesFile = await activeStore.get<string>('cookiesFilePath') || null;
      const result = await invoke('download_video', {
        url: sanitizedUrl,
        format: format === 'audio' ? (selectedFormatId || 'audio-320k') : (selectedFormatId || 'video'),
        downloadPath: downloadPath,
        cookiesBrowser: currentBrowser === 'none' ? null : currentBrowser,
        cookiesFile: currentBrowser === 'custom' ? cookiesFile : null
      });
      toast.success('download complete! :D stored in: ' + downloadPath);
      console.log('download result : ', result);
    }
    catch (error) {
      toast.error(String(error));
      console.error('download error: ', error);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-page-wrapper">
    <div className="download-welcome-container flex flex-col items-center">
        <SplitText
          text="start downloading!"
          className="download-welcome-message"
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
        <img 
          src={blackCat} 
          alt="Black Cat" 
          className="w-24 h-24 object-contain rounded-2xl mt-4 hover:scale-105 transition-transform duration-300"
        />
    </div>
        
    <div className="download-form-container">
        <div className="flex flex-col w-full max-w-md m-auto space-y-5">
          <div className="flex gap-3 mt-4 w-full">
            <Button 
              variant={format === 'video' ? 'default' : 'outline'}
              onClick={() => handleFormatChange('video')}
              disabled={isSoundcloudLink}
              size="lg"
              className="flex-1 font-semibold text-sm h-11"
            >
              video + audio
            </Button>
            <Button 
              variant={format === 'audio' ? 'default' : 'outline'}
              onClick={() => handleFormatChange('audio')}
              size="lg"
              className="flex-1 font-semibold text-sm h-11"
            >
              audio only
            </Button>
          </div>

          <div className="flex w-full items-center space-x-3 mt-1">
            <div className="relative flex-1 flex items-center">
              {isYoutubeLink && (
                <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-red-500 animate-in zoom-in-75 duration-200">
                  <YoutubeIcon className="w-5 h-5" />
                </div>
              )}
              {isSoundcloudLink && (
                <div className="absolute left-3.5 flex items-center justify-center pointer-events-none animate-in zoom-in-75 duration-200">
                  <img 
                    src={soundcloudLogo} 
                    alt="SoundCloud logo" 
                    className="w-5 h-5 object-contain"
                  />
                </div>
              )}
              <Input
                type="text"
                placeholder="enter youtube or soundcloud link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={loading}
                className={cn(
                  "h-12 text-sm flex-1 transition-all duration-200",
                  (isYoutubeLink || isSoundcloudLink) ? "pl-11 pr-4" : "px-4"
                )}
              />
            </div>
            <Button 
              onClick={handleDownload} 
              disabled={isDownloadDisabled}
              size="lg"
              className="h-12 px-6 font-bold text-sm shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  downloading...
                </>
              ) : (
                'download'
              )}
            </Button>
          </div>

          {link.trim() !== '' && !isValidLink ? (
            <p className="text-[11px] text-destructive italic text-center mt-1">
              {validationError}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 italic text-center mt-1">
              * playlist support coming soon maybe
            </p>
          )}

          {cookiesBrowser === 'none' && (
            <div className="text-[11px] text-amber-500/90 border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 rounded-lg text-center mt-1 font-medium flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <span>⚠️ cookies source is currently disabled! you might run into download blocks since youtube thinks you're a bot. configure it in settings.</span>
            </div>
          )}

          {/* Info Card / Loader */}
          {loadingInfo && (
            <div className="w-full mt-2 p-5 border rounded-xl bg-card/25 backdrop-blur-sm flex items-center justify-center gap-3.5 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground animate-pulse">fetching media options...</span>
            </div>
          )}

          {videoInfo && !loadingInfo && (
            <div className="w-full mt-2 p-5 border rounded-xl bg-card/40 backdrop-blur-sm flex flex-col gap-4 shadow-sm text-left">
              <div className="flex gap-4">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title} 
                  className="w-32 h-20 object-cover rounded-lg border bg-muted shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                    {videoInfo.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono">
                    duration: {videoInfo.duration_string}
                  </p>
                </div>
              </div>

              {format === 'video' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-bold tracking-wider">
                    select video quality
                  </label>
                  <Popover open={videoComboboxOpen} onOpenChange={setVideoComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={videoComboboxOpen}
                        className="w-full justify-between h-10 px-3 bg-muted/30 hover:bg-muted/50 font-normal border border-input rounded-md"
                      >
                        <span className="truncate">
                          {(() => {
                            const selected = extractResolutions(videoInfo.formats).find(
                              (f) => f.format_id === selectedFormatId
                            );
                            return selected
                              ? `${selected.height}p (${selected.ext.toUpperCase()})${selected.fps ? ` ${selected.fps}fps` : ''}${selected.filesize || selected.filesize_approx ? ` ~${Math.round((selected.filesize || selected.filesize_approx || 0) / 1024 / 1024)}MB` : ''}`
                              : "Select video quality...";
                          })()}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-lg rounded-md overflow-hidden">
                      <Command>
                        <CommandList>
                          <CommandEmpty>No formats found.</CommandEmpty>
                          <CommandGroup>
                            {extractResolutions(videoInfo.formats).map((f) => (
                              <CommandItem
                                key={f.format_id}
                                value={`${f.height}p ${f.ext} ${f.fps || ''}`}
                                onSelect={() => {
                                  setSelectedFormatId(f.format_id);
                                  setVideoComboboxOpen(false);
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm hover:bg-muted rounded-sm"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    selectedFormatId === f.format_id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="truncate">
                                  {f.height}p ({f.ext.toUpperCase()}) {f.fps ? `${f.fps}fps` : ''} {f.filesize || f.filesize_approx ? `~${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)}MB` : ''}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {format === 'audio' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-bold tracking-wider">
                    select audio quality
                  </label>
                  <Popover open={audioComboboxOpen} onOpenChange={setAudioComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={audioComboboxOpen}
                        className="w-full justify-between h-10 px-3 bg-muted/30 hover:bg-muted/50 font-normal border border-input rounded-md"
                      >
                        <span className="truncate">
                          {(() => {
                            const options: Record<string, string> = {
                              "audio-320k": "320kbps (Best Quality)",
                              "audio-256k": "256kbps (High Quality)",
                              "audio-192k": "192kbps (Medium Quality)",
                              "audio-128k": "128kbps (Standard Quality)",
                            };
                            return options[selectedFormatId] || "Select audio quality...";
                          })()}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-lg rounded-md overflow-hidden">
                      <Command>
                        <CommandList>
                          <CommandEmpty>No qualities found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              { id: "audio-320k", label: "320kbps (Best Quality)" },
                              { id: "audio-256k", label: "256kbps (High Quality)" },
                              { id: "audio-192k", label: "192kbps (Medium Quality)" },
                              { id: "audio-128k", label: "128kbps (Standard Quality)" },
                            ].map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.label}
                                onSelect={() => {
                                  setSelectedFormatId(opt.id);
                                  setAudioComboboxOpen(false);
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm hover:bg-muted rounded-sm"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    selectedFormatId === opt.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{opt.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}

          {downloadPath !== null && (
            <div className="flex flex-col space-y-1.5 text-left w-full mt-2">
              <label htmlFor="download-path" className="text-xs text-muted-foreground font-bold  tracking-wider">
                file destination!
              </label>
              <div className="flex gap-2.5 w-full">
                <div className="relative flex-1 flex gap-2">
                  <Input 
                    id="download-path" 
                    value={downloadPath} 
                    placeholder="select a folder" 
                    readOnly 
                    className="text-sm h-10 bg-muted/40 px-3 flex-1"
                  />
                  {pathHistory.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Recent destinations">
                          <History className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[350px] max-w-[90vw] bg-popover border border-border shadow-lg p-1.5 rounded-lg">
                        <div className="text-[10px] text-muted-foreground font-bold px-2 py-1 tracking-wider select-none border-b border-border/40 mb-1">
                          recent destinations
                        </div>
                        {pathHistory.map((path, idx) => (
                          <DropdownMenuItem 
                            key={idx} 
                            onClick={() => handleSelectHistoryPath(path)}
                            className="text-xs font-mono py-1.5 px-2 hover:bg-muted/80 rounded cursor-pointer flex justify-between items-center group w-full"
                          >
                            <span className="truncate flex-1 text-left" title={path}>{path}</span>
                            {path === downloadPath && <span className="text-[10px] text-emerald-500 font-bold ml-2 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">active</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleBrowse} className="h-10 px-4">
                  browse
                </Button>
              </div>
            </div>
          )}
        </div>
    </div>

    </div>
  )
}
