import React, { useState } from 'react';
import './Download.css'
import SplitText from '../../components/SplitText'
import { Input } from '@/components/ui/input';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"


const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Download() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false); //loading so we can disable button when clicked
  const [format, setFormat] = useState('video'); //video or audio format
  const [message, setMessage] = useState(''); //message for errors or success

  const handleDownload = async () => {
    if (!link.trim()) {
      setMessage("please enter a valid youtube link.")
      return;
    }

    setLoading(true);
    setMessage('');

    try{
      const result = await invoke ('download_video', {
        url: link,
        format: format
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
    <div className="home-page-wrapper">
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
          {/* Format selector */}
          <div className="flex gap-2 mt-4 font-(sans-serif:--Readex Pro">
            <Button 
              variant={format === 'video' ? 'default' : 'outline'}
              onClick={() => setFormat('video')}
            >
              Video
            </Button>
            <Button 
              variant={format === 'audio' ? 'default' : 'outline'}
              onClick={() => setFormat('audio')}
            >
              Audio Only
            </Button>
          </div>

          {/* Input and download button */}
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter YouTube link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleDownload} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                'Download'
              )}
            </Button>
          </div>

          {/* Status message */}
          {message && (
            <Alert variant={message.includes('Error') ? 'destructive' : 'default'}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </div>
    </div>
  )
}