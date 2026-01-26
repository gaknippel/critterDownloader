import React, { useState, useEffect } from 'react';
import './Download.css'
import SplitText from '../../components/SplitText'
import { Input } from '@/components/ui/input';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Download() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('video');
  const [message, setMessage] = useState('');
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  // Load download path from settings
  useEffect(() => {
    const loadPath = async () => {
      const store = await Store.load('settings.json');
      const savedPath = await store.get<string>('downloadPath');
      setDownloadPath(savedPath || null);
    };
    
    loadPath();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDownload = async () => {
    if (!link.trim()) {
      setMessage("please enter a valid youtube link.")
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await invoke('download_video', {
        url: link,
        format: format,
        downloadPath: downloadPath
      });
      setMessage('download complete!');
      console.log('download result : ', result);
    }
    catch (error) {
      setMessage(`Error: ${String(error)}`);
      console.error('download error: ', error);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-page-wrapper">
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
        
        <div className="flex flex-col w-full max-w-sm m-auto space-y-4">
          <div className="flex gap-2 mt-4 font-(sans-serif:--Readex Pro">
            <Button 
              variant={format === 'video' ? 'default' : 'outline'}
              onClick={() => setFormat('video')}
            >
              video
            </Button>
            <Button 
              variant={format === 'audio' ? 'default' : 'outline'}
              onClick={() => setFormat('audio')}
            >
              audio only
            </Button>
          </div>

          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="enter youtube link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleDownload} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  downloading...
                </>
              ) : (
                'Download'
              )}
            </Button>
          </div>

          {downloadPath && (
            <p className="text-sm text-muted-foreground">
              Saving to: {downloadPath}
            </p>
          )}
        </div>

        {message && (
          <Alert 
            variant={message.includes('Error') ? 'destructive' : 'default'}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-sm z-50"
          >
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}
    </div>
  )
}