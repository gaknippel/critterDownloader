import './Home.css'
import SplitText from '../../components/SplitText'
import steamHappy from '../../assets/steamHappy.gif'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { open } from '@tauri-apps/plugin-shell'
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { History} from 'lucide-react'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Home() {
  const navigate = useNavigate();
  const [patchNotes, setPatchNotes] = useState('loading patch notes...');
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(true);

  useEffect(() => {
    // 1. Fetch patch notes
    const fetchPatchNotes = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/gaknippel/critterDownloader/main/patchNotes.md');
        if (response.ok) {
          const text = await response.text();
          setPatchNotes(text);
        } else {
          setPatchNotes('Failed to load patch notes.');
        }
      } catch (error) {
        console.error('Error fetching patch notes:', error);
        setPatchNotes('Failed to load patch notes.');
      }
    };

    // 2. Check for app updates
    const checkVersion = async () => {
      try {
        setCheckingUpdate(true);
        // Get current version from Tauri app api
        const current = await getVersion();
        setCurrentVersion(current);

        // Fetch latest version info from repository
        const response = await fetch('https://raw.githubusercontent.com/gaknippel/critterDownloader/main/latest.json');
        if (response.ok) {
          const data = await response.json();
          setLatestVersion(data.version);
          
          const cleanCurrent = current.replace(/^v/, '').trim();
          const cleanLatest = data.version.replace(/^v/, '').trim();
          
          if (cleanCurrent !== cleanLatest) {
            setIsUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error('Failed to check version:', error);
      } finally {
        setCheckingUpdate(false);
      }
    };

    fetchPatchNotes();
    checkVersion();
  }, []);

  const handleDownloadUpdate = async () => {
    try {
      await open('https://github.com/gaknippel/critterDownloader/releases/latest');
    } catch (error) {
      console.error('Failed to open releases URL:', error);
    }
  };

  return (
    <div className="home-page-wrapper">
      <div className="home-grid">
        {/* Left Column: Hero & Action Panel */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 lg:sticky lg:top-6">
          <div className="w-full">
            <SplitText
              text="welcome!"
              className="home-welcome"
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
          </div>
          
          <div className="w-full flex justify-center lg:justify-start">
            <div className="relative group rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-lg transition-all duration-300 bg-card">
              <img 
                src={steamHappy} 
                alt="Steam Happy" 
                className="w-40 h-40 object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="space-y-3 w-full max-w-sm">
            <p className="text-sm text-muted-foreground">
              sick and tired of all those dogshit youtube downloaders? use this one!
            </p>
            <Button 
              onClick={() => navigate('/download')} 
              size="lg" 
              className="w-full font-semibold transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02]"
            >
              go to download page
            </Button>
          </div>

          {/* Version Checker Card */}
          <div className="w-full max-w-sm rounded-xl border bg-card/35 backdrop-blur-sm p-4 flex flex-col gap-2.5 shadow-sm">
            {checkingUpdate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/45"></span>
                </span>
                checking for updates...
              </div>
            ) : isUpdateAvailable ? (
              <div className="flex flex-col gap-2 w-full text-left">
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-xs tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  update available!
                </div>
                <p className="text-xs text-muted-foreground">
                  version <span className="font-mono bg-muted px-1.5 py-0.5 rounded border">{latestVersion}</span> is out. you are running <span className="font-mono bg-muted px-1.5 py-0.5 rounded border">v{currentVersion}</span>.
                </p>
                <Button 
                  size="sm" 
                  onClick={handleDownloadUpdate} 
                  className="mt-1 w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold gap-1.5 text-xs h-8"
                >
             
                  download update
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-xs">
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  up to date
                </span>
                <span className="font-mono text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded border">
                  v{currentVersion}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Revamped Patch Notes Panel */}
        <div className="flex flex-col gap-3.5 w-full text-left">
          <h2 className="patch-notes-title flex items-center gap-2 text-lg font-bold tracking-tight">
            <History size={18} className="text-muted-foreground" />
            <span>patch notes & changelog</span>
          </h2>
          <ScrollArea className="h-[400px] lg:h-[600px] rounded-xl border bg-card/25 backdrop-blur-sm p-6 text-left shadow-sm">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="markdown-h1 flex items-center gap-1.5" {...props} />,
                h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
                h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
                p: ({node, ...props}) => <p className="markdown-p" {...props} />,
                ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
                ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
                li: ({node, ...props}) => <li className="markdown-li" {...props} />,
                code: ({node, ...props}) => <code className="markdown-code" {...props} />,
                a: ({node, href, children, ...props}) => (
                  <a
                    className="markdown-link"
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (href) {
                        open(href);
                      }
                    }}
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {patchNotes}
            </ReactMarkdown>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}