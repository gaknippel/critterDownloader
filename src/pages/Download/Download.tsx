import React, { useState } from 'react';
import './Download.css'
import SplitText from '../../components/SplitText'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Download() {
  const [link, setLink] = useState('');

  const handleDownload = () => {
    // Implement download logic here
    console.log('Downloading link:', link);
  };

  return (
    <div className="home-page-wrapper">
        <SplitText
          text="start downloading!"
          className="download-welcome-message"
          delay={15}
          duration={0.3}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
          />
          <div className="flex w-full max-w-sm items-center space-x-2 m-auto">
            <Input
              type="text"
              placeholder="Enter YouTube link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-4"
            />
            <Button onClick={handleDownload} className="mt-4">Download</Button>
          </div>
    </div>
  )
}